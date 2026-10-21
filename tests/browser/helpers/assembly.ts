import { expect, type Page } from "@playwright/test";
/** Legacy independent-position scenarios explicitly opt out of the new pair default. */
export async function selectAssemblySlot(
  page: Page,
  label: string,
  independent = true,
) {
  const index = page.getByRole("complementary", {
    name: "Piezas del montaje",
    exact: true,
  });
  if (
    !(await index
      .locator("details")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  ) {
    await index.locator("summary").click();
  }
  await index.getByRole("button", { name: label, exact: true }).click();
  await expect(page.locator("#assembly-selection")).toBeVisible();
  const paired = page.getByRole("checkbox", {
    name: "Aplicar a ambos lados",
    exact: true,
  });
  if (independent && (await paired.count())) await paired.uncheck();
}
