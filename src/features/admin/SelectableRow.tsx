import type { ReactNode } from "react";
/** The row is clickable; its native button remains the keyboard entry point. */
export function SelectableRow({
  selected,
  onSelect,
  children,
}: {
  selected?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <tr
      data-selectable
      className={selected ? "row-selected" : undefined}
      onClick={(event) => {
        if (
          !(event.target as Element).closest(
            "button,a,input,select,textarea,label",
          )
        )
          onSelect();
      }}
    >
      {children}
    </tr>
  );
}
