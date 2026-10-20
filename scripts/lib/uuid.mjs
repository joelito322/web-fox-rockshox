import { createHash } from "node:crypto";
// RFC 9562 version 5; deterministic identities for immutable catalog captures.
export function v5(name, namespace) {
  const ns = Buffer.from(namespace.replaceAll("-", ""), "hex");
  if (ns.length !== 16) throw Error("invalid_uuid_namespace");
  const hash = createHash("sha1")
    .update(ns)
    .update(name)
    .digest()
    .subarray(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const text = hash.toString("hex");
  return `${text.slice(0, 8)}-${text.slice(8, 12)}-${text.slice(12, 16)}-${text.slice(16, 20)}-${text.slice(20)}`;
}
