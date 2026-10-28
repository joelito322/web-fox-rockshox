import {
  Children,
  createContext,
  useContext,
  useCallback,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
const DrawerActionContext = createContext<{
  target: HTMLElement | null;
  setBusy: (busy: boolean) => void;
} | null>(null);
/** Nested details reuse the drawer's fixed action area without a second panel. */
export function DrawerActions({
  children,
  busy = false,
}: {
  children: ReactNode;
  busy?: boolean;
}) {
  const context = useContext(DrawerActionContext);
  const setBusy = context?.setBusy;
  useLayoutEffect(() => {
    setBusy?.(busy);
    return () => setBusy?.(false);
  }, [setBusy, busy]);
  if (!Children.toArray(children).length) return null;
  return context?.target
    ? createPortal(
        <fieldset className="drawer-actions" disabled={busy}>
          {children}
        </fieldset>,
        context.target,
      )
    : null;
}
export function Drawer({
  title,
  children,
  onClose,
  footer,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  busy?: boolean;
}) {
  const [actionTarget, setActionTarget] = useState<HTMLElement | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  busy = busy || actionBusy;
  const headingId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const close = useRef(onClose);
  close.current = onClose;
  const [closing, setClosing] = useState(false);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finishClose = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimeout(timer.current);
    setClosing(false);
    close.current();
  }, []);
  const requestClose = useCallback(() => {
    if (pending.current || busyRef.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      close.current();
      return;
    }
    pending.current = true;
    setClosing(true);
    const duration = dialog.current
      ? getComputedStyle(dialog.current)
          .getPropertyValue("--motion-panel")
          .trim()
      : "";
    const ms = parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000);
    // Fallback if the browser suppresses animationend (e.g. a hidden tab).
    timer.current = setTimeout(
      finishClose,
      (Number.isFinite(ms) ? ms : 220) + 50,
    );
  }, [finishClose]);
  useLayoutEffect(() => {
    const d = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (preference.matches) finishClose();
    };
    preference.addEventListener("change", reduce);
    d?.addEventListener("cancel", cancel);
    return () => {
      d?.removeEventListener("cancel", cancel);
      preference.removeEventListener("change", reduce);
      clearTimeout(timer.current);
      pending.current = false;
      d?.close();
      // A discard can close an editor and its confirmation in the same commit.
      // Restore focus only after both native modal layers have been removed.
      queueMicrotask(() => {
        if (previous?.isConnected) previous.focus({ preventScroll: true });
      });
    };
  }, [finishClose, requestClose]);
  return (
    <dialog
      ref={dialog}
      className={`drawer${closing ? " is-closing" : ""}`}
      aria-labelledby={headingId}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName.startsWith("panel-exit")
        )
          finishClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          // A fieldset/form may shrink while handling a click. Only the actual
          // outside surface is a backdrop dismissal, never empty panel space.
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            requestClose();
        }
      }}
    >
      <header>
        <h2 id={headingId}>{title}</h2>
        <button
          onClick={requestClose}
          disabled={busy}
          className="icon-button"
          aria-label="Cerrar detalle"
        >
          <X />
        </button>
      </header>
      <DrawerActionContext.Provider
        value={{ target: actionTarget, setBusy: setActionBusy }}
      >
        <div className="drawer-body">{children}</div>
      </DrawerActionContext.Provider>
      <footer ref={setActionTarget} className="drawer-footer">
        {footer}
      </footer>
    </dialog>
  );
}
