import { AlertCircle, LoaderCircle } from "lucide-react";
export function Loading({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="feedback" role="status">
      <LoaderCircle size={20} className="spin" />
      <span>{label}…</span>
    </div>
  );
}
export function Notice({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="notice" role="alert">
      <AlertCircle size={18} />
      <div>
        {children}
        {onRetry && (
          <button className="text-button" onClick={onRetry}>
            Volver a intentar
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-line" />
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
