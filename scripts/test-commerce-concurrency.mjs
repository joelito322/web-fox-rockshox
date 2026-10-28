import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  readProjectEnvironment,
  postgresEnvironment,
} from "./lib/environment.mjs";
const env = postgresEnvironment(readProjectEnvironment());
const a = randomUUID(),
  b = randomUUID(),
  offer = randomUUID();
const contact = { name: "Prueba concurrente", contact: "demo@example.invalid" };
function sql(text) {
  const r = spawnSync("psql", ["-X", "-At", "-q", "-v", "ON_ERROR_STOP=1"], {
    env,
    input: text,
    encoding: "utf8",
    timeout: 60000,
  });
  if (r.status !== 0)
    throw new Error(
      r.stderr ||
        `PostgreSQL command failed: ${r.error?.code ?? r.signal ?? r.status}`,
    );
  return r.stdout.trim();
}
function claims(id) {
  return `select set_config('request.jwt.claims','${JSON.stringify({ sub: id, role: "authenticated" })}',true);set local role authenticated;`;
}
function start(text, markerText = "LOCK_READY", keepOpen = false) {
  const child = spawn("psql", ["-X", "-At", "-q", "-v", "ON_ERROR_STOP=1"], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "",
    error = "";
  let reached;
  const marker = new Promise((r) => {
    reached = r;
  });
  child.stdout.on("data", (chunk) => {
    output += chunk;
    if (output.includes(markerText)) reached();
  });
  child.stderr.on("data", (chunk) => (error += chunk));
  const done = new Promise((resolve) =>
    child.on("close", (code) =>
      resolve({ code, output: output.trim(), error }),
    ),
  );
  let ended = false;
  function finish(tail = "") {
    if (ended) return;
    ended = true;
    child.stdin.end(tail);
  }
  if (keepOpen) child.stdin.write(text + "\n");
  else finish(text);
  return { done, marker, finish };
}
function assert(ok, name) {
  if (!ok) throw new Error(name);
  console.log("PASS " + name);
}
let orderA, orderB, held;
try {
  sql(
    `begin;insert into auth.users(id,email,email_confirmed_at)values('${a}','validation-race-${a}@example.invalid',now()),('${b}','validation-race-${b}@example.invalid',now());insert into public.store_offers(id,sku,component_id,label,commercial_identity,unit_of_sale,base_price_cents,stock_total,active)select '${offer}','RACE-${offer}',id,'Prueba última unidad','{"finish":"Negro","finish_id":"black"}','unit',10000,1,true from public.components where published and category='frame' limit 1;commit;`,
  );
  const lines = [{ offer_id: offer, quantity: 1 }];
  const json = JSON.stringify(lines),
    c = JSON.stringify(contact);
  const summaries = {};
  const revisions = {};
  for (const id of [a, b]) {
    const result = sql(
      `begin;${claims(id)}select 'DATA:'||public.sales_cart()::text;select 'SUM:'||public.sales_summary('${json}','${c}','pickup','{}')::text;commit;`,
    );
    summaries[id] = JSON.parse(
      result
        .split("\n")
        .find((l) => l.startsWith("SUM:"))
        .slice(4),
    );
    revisions[id] = JSON.parse(
      result
        .split("\n")
        .find((l) => l.startsWith("DATA:"))
        .slice(5),
    ).revision;
    sql(
      `begin;${claims(id)}select public.sales_save_cart(${revisions[id]},'${json}');commit;`,
    );
    revisions[id]++;
  }
  const keyA = randomUUID(),
    keyB = randomUUID();
  const create = (id) =>
    `select 'ORDER:'||public.sales_create_order('${id === a ? keyA : keyB}','${summaries[id].hash}','${json}','${c}','pickup','{}',${revisions[id]},null)::text;`;
  // A owns the offer lock before B checks out. They use separate PostgreSQL sessions.
  const first = start(
    `begin;select 1 from public.store_offers where id='${offer}' for update;select 'LOCK_READY';select pg_sleep(1);${claims(a)}${create(a)}commit;`,
  );
  await Promise.race([
    first.marker,
    first.done.then((r) => {
      throw new Error("Offer lock failed: " + r.error);
    }),
  ]);
  const second = start(`begin;${claims(b)}${create(b)}commit;`);
  const [one, two] = await Promise.all([first.done, second.done]);
  assert(
    one.code === 0 &&
      two.code !== 0 &&
      two.error.includes("sales_insufficient_stock"),
    "two buyers of the final unit produce one reservation",
  );
  orderA = one.output
    .split("\n")
    .find((l) => l.startsWith("ORDER:"))
    .slice(6);
  // Let A expire while its approval waits on the inventory lock. B reuses released stock.
  // Open the payer before starting the expiry clock. Connection latency must not
  // decide whether the transaction entered before its reservation expired.
  sql(
    `update public.orders set reservation_expires_at=clock_timestamp() where id='${orderA}';`,
  );
  const blocker = (held = start(
    `begin;select 1 from public.store_offers where id='${offer}' for update;select 'LOCK_READY';`,
    "LOCK_READY",
    true,
  ));
  await Promise.race([
    blocker.marker,
    blocker.done.then((r) => {
      throw new Error("Expiry lock failed: " + r.error);
    }),
  ]);
  const payment = start(
    `begin;update public.orders set reservation_expires_at=clock_timestamp()+interval '2 seconds' where id='${orderA}' returning 'EXPIRES:'||(extract(epoch from reservation_expires_at)*1000)::text;${claims(a)}select 'BEFORE_PAY:'||(extract(epoch from clock_timestamp())*1000)::text;select public.sales_pay_demo('${orderA}','${randomUUID()}','yape_demo','approved');commit;`,
    "BEFORE_PAY:",
  );
  await Promise.race([
    payment.marker,
    payment.done.then((r) => {
      throw new Error("Payment entry failed: " + r.error);
    }),
  ]);
  blocker.finish("select pg_sleep(3);commit;\n");
  const blockerResult = await blocker.done;
  const late = await payment.done;
  const expiresAt = Number(
    late.output
      .split("\n")
      .find((line) => line.startsWith("EXPIRES:"))
      ?.slice(8),
  );
  const entered = Number(
    late.output
      .split("\n")
      .find((line) => line.startsWith("BEFORE_PAY:"))
      ?.slice(11),
  );
  assert(
    Number.isFinite(entered) && entered < expiresAt,
    "approval transaction starts before the reservation expires",
  );
  assert(
    blockerResult.code === 0 &&
      late.code !== 0 &&
      late.error.includes("sales_order_expired_or_closed"),
    "payment waiting across expiry cannot approve an expired reservation",
  );
  const bResult = sql(`begin;${claims(b)}${create(b)}commit;`);
  orderB = bResult
    .split("\n")
    .find((l) => l.startsWith("ORDER:"))
    .slice(6);
  const paymentKey = randomUUID();
  const pay = `select public.sales_pay_demo('${orderB}','${paymentKey}','card_demo','approved');`;
  const [p1, p2] = await Promise.all([
    start(`begin;${claims(b)}${pay}commit;`).done,
    start(`begin;${claims(b)}${pay}commit;`).done,
  ]);
  assert(
    p1.code === 0 && p2.code === 0,
    "concurrent identical approval recovers one successful result",
  );
  const counters = JSON.parse(
    sql(
      `select json_build_object('stock',(select stock_total from public.store_offers where id='${offer}'),'success',(select count(*) from public.payment_attempts where order_id='${orderB}' and status='approved'),'events',(select count(*) from public.order_events where order_id='${orderB}' and event_type='payment_demo_approved'));`,
    ),
  );
  assert(
    counters.stock === 0 && counters.success === 1 && counters.events === 1,
    "inventory, payment and success event consumed exactly once",
  );
} finally {
  held?.finish("rollback;\n");
  sql(
    `begin;delete from public.order_events where order_id in(select id from public.orders where user_id in('${a}','${b}'));delete from public.payment_attempts where order_id in(select id from public.orders where user_id in('${a}','${b}'));delete from public.order_items where order_id in(select id from public.orders where user_id in('${a}','${b}'));delete from public.orders where user_id in('${a}','${b}');delete from public.carts where user_id in('${a}','${b}');delete from public.store_offers where id='${offer}';delete from auth.users where id in('${a}','${b}');commit;`,
  );
  console.log("Temporary concurrency fixtures cleaned up");
}
