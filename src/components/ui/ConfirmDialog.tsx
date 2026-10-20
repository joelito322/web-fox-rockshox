import { useEffect, useId, useRef, type ReactNode } from "react";
export function ConfirmDialog({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    heading = useId(),
    cancel = useRef(onCancel);
  cancel.current = onCancel;
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const escape = (e: Event) => {
      e.preventDefault();
      cancel.current();
    };
    dialog?.addEventListener("cancel", escape);
    return () => {
      dialog?.removeEventListener("cancel", escape);
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="confirm-dialog native-confirm"
      role="alertdialog"
      aria-labelledby={heading}
      ref={ref}
    >
      <h2 id={heading}>{title}</h2>
      {children}
    </dialog>
  );
}
