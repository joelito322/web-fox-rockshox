import { useId } from "react";
import { Check, LayoutGrid } from "lucide-react";
import { categoryGroups, categoryLabels, type Category } from "./model";

// Side-view silhouettes share a 24px grid and one stroke colour.
const outlines: Record<Category, string> = {
  frame: "M3 17 8 7l6 10H3Zm5-10h10l-4 10m4-10 3 10M6 4h5m6 0h3l-2 3",
  fork: "m9 3 1 6-3 11m8-17 1 6-3 11M8 13l6 1M6 20h3m3 0h3M9 7l7 1",
  shock: "m9 3 2 2-6 14-2 2m12-18-2 2 6 14 2 2M9 8l6 2-7 2 9 2-7 2 5 2",
  rim: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-3 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
  tire: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 4l1 3m6-3-1 3m6 1-3 1m3 6-3-1m-2 6-1-3m-6 3 1-3m-5-2 3-1M4 8l3 1",
  hub: "M3 12h18M8 6v12m8-12v12M8 8h8v8H8M5 9v6m14-6v6",
  brake: "M4 4h8l3 3v5l-3 2H7v5H4V4Zm11 5h5v8h-8m-5-9h4m6 9v3",
  rotor: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2",
  cassette: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-3 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 2v2m0 16v2M2 12h2m16 0h2m-5-9-1 2M6 19l1-2M3 7l2 1m14 8 2 1",
  chain: "m10 7 3-3a4 4 0 0 1 6 6l-3 3M8 11l-3 3a4 4 0 0 0 6 6l3-3M8 16l8-8",
  rear_derailleur: "M10 3h5v5l-3 3 3 4-3 5M8 10l-3 4 3 5m7-14h4M10 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  bottom_bracket: "M8 5c3 0 5 3 5 7s-2 7-5 7-5-3-5-7 2-7 5-7Zm0 4c1 0 2 1 2 3s-1 3-2 3-2-1-2-3 1-3 2-3Zm0-4h8c3 0 5 3 5 7s-2 7-5 7H8",
  crankset: "M15 9a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 9l9 11h3m-3-2v3",
  pedals: "m4 7 14-2 3 12-14 2L4 7Zm1 5H2m7-3 1 6m4-7 1 6m3-3L8 13",
  handlebar: "m2 7 5 2 2 4h6l2-4 5-2M2 5v4m20-4v4m-12 4v3h4v-3",
  stem: "M3 7h6l4 4h7v6h-9l-5-4H3V7Zm13 4v6M5 9v2m13 2v2",
  seatpost: "M8 3h8M9 5h6l-1 4-1 12h-3L9 9V5Zm0 4h5",
  saddle: "M3 9c1-3 5-4 8-2l9 3c2 1 2 3-1 3H6c-3 0-4-2-3-4Zm4 4 2 4h6l3-4",
};

function PartIcon({ category }: { category: Category }) {
  return <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={outlines[category]} /></svg>;
}

export function CategorySelector({ selected, open, onSelect }: {
  selected?: Category;
  open: boolean;
  onSelect: (category?: Category) => void;
}) {
  const id = useId();
  return (
    <aside id="catalog-categories" className={`category-list ${open ? "open" : ""}`} aria-label="Categorías">
      <div className="category-list-heading">Categorías</div>
      <button className={`category-all${!selected ? " selected" : ""}`} aria-pressed={!selected} onClick={() => onSelect()}>
        <LayoutGrid className="category-icon" strokeWidth={1.6} aria-hidden="true" />
        <span className="category-option-label">Todas las piezas</span>
        {!selected && <Check className="category-check" size={15} aria-hidden="true" />}
      </button>
      <div className="category-groups">
        {categoryGroups.map((group, index) => (
          <section className="category-group" key={group.label} aria-labelledby={`${id}-${index}`}>
            <h2 id={`${id}-${index}`}>{group.label}</h2>
            <div className="category-options">
              {group.categories.map(category => (
                <button key={category} className={selected === category ? "selected" : ""} aria-pressed={selected === category} onClick={() => onSelect(category)}>
                  <PartIcon category={category} />
                  <span className="category-option-label">{categoryLabels[category]}</span>
                  {selected === category && <Check className="category-check" size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
