import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Fields, sourceFields } from "./Fields";
describe("administrative field validation", () => {
  it("associates a measure error with its control", () => {
    render(
      <Fields
        fields={[
          { key: "travel_mm", label: "Recorrido", kind: "number", min: 1 },
        ]}
        value={{ travel_mm: 0 }}
        onChange={() => {}}
        errors={{ travel_mm: "El valor es menor al permitido." }}
      />,
    );
    const input = screen.getByLabelText("Recorrido");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "El valor es menor al permitido.",
    );
  });
  it("shows a source error only on the affected record", () => {
    render(
      <Fields
        fields={sourceFields}
        value={{
          sources: [{ url: "invalid" }, { url: "https://example.com" }],
        }}
        onChange={() => {}}
        errors={{ "sources.0.url": "Revisa este enlace." }}
      />,
    );
    const [first, second] = screen.getAllByLabelText("Enlace oficial");
    expect(first).toHaveAttribute("aria-invalid", "true");
    expect(second).toHaveAttribute("aria-invalid", "false");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
