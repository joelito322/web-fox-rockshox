import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { Drawer } from "./Drawer";
export function useUnsavedChanges(
  dirty: boolean,
  save: () => Promise<boolean>,
  busy = false,
) {
  const approved = useRef(false);
  const blocker = useBlocker(() => dirty && !approved.current);
  useEffect(() => {
    if (!dirty) approved.current = false;
  }, [dirty]);
  const [pending, setPending] = useState<null | (() => void)>(null);
  useEffect(() => {
    const leave = (event: Event) => {
      if (!dirty) return;
      event.preventDefault();
      setPending(
        () => (event as CustomEvent<{ continue: () => void }>).detail.continue,
      );
    };
    window.addEventListener("atlas:request-signout", leave);
    return () => window.removeEventListener("atlas:request-signout", leave);
  }, [dirty]);
  const next = useRef(pending);
  next.current = pending;
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function request(action: () => void) {
    if (dirty) setPending(() => action);
    else action();
  }
  const visible = blocker.state === "blocked" || !!pending;
  function cancel() {
    setPending(null);
    if (blocker.state === "blocked") blocker.reset();
  }
  function proceed() {
    approved.current = true;
    const action = next.current;
    setPending(null);
    if (blocker.state === "blocked") blocker.proceed();
    else action?.();
  }
  const dialog = visible ? (
    <Drawer title="Cambios sin guardar" onClose={cancel} busy={busy}>
      <p>Guarda los cambios antes de continuar o descártalos.</p>
      <div className="stack-actions">
        <button
          className="button dark"
          disabled={busy}
          onClick={() =>
            void save().then((ok) => {
              if (ok) proceed();
            })
          }
        >
          Guardar y continuar
        </button>
        <button className="button outline" disabled={busy} onClick={proceed}>
          Descartar cambios
        </button>
        <button className="text-button" disabled={busy} onClick={cancel}>
          Seguir editando
        </button>
      </div>
    </Drawer>
  ) : null;
  return { request, dialog };
}
