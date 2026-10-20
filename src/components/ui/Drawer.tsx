import { useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const headingId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    const d = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      close.current();
    };
    d?.addEventListener("cancel", cancel);
    return () => {
      d?.removeEventListener("cancel", cancel);
      d?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby={headingId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2 id={headingId}>{title}</h2>
        <button
          onClick={onClose}
          className="icon-button"
          aria-label="Cerrar detalle"
        >
          <X />
        </button>
      </header>
      <div className="drawer-body">{children}</div>
    </dialog>
  );
}
