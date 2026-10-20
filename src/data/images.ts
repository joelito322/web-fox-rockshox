import maxxisAssegai from "../assets/images/catalog/assegai.jpg";
import maxxisDhrII from "../assets/images/catalog/minion-dhr-ii.jpg";
import rockbrosNylon from "../assets/images/catalog/rockbros-nylon.jpg";
import supremeDH from "../assets/images/catalog/supreme-dh-v5.jpg";
import fox40 from "../assets/images/catalog/fox-40-my27-black.png";
import maguraMT5 from "../assets/images/catalog/magura-mt5.png";
import marzocchiZ1Black from "../assets/images/catalog/marzocchi-z1-rail-black.jpg";
import marzocchiZ1Red from "../assets/images/catalog/marzocchi-z1-rail-red.jpg";
import fox36Factory from "../assets/images/fox-36-factory.webp";
import foxX2 from "../assets/images/fox-x2.png";
import fox34StepCast from "../assets/images/fox-34-stepcast.png";
import rockshoxBoxxer from "../assets/images/RockShox  oxxer.png";
import rockshoxLyrik from "../assets/images/RockShox Lyrik Ultimate.png";
import rockshoxSid from "../assets/images/RockShox SID Ultimate.png";
import rockshoxSuperDeluxe from "../assets/images/RockShox Super Deluxe.png";

const photoFiles = import.meta.glob<string>("../assets/images/catalog/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const photosBySlug: Record<string, string> = Object.fromEntries(
  Object.entries(photoFiles).map(([path, url]) => [
    path.split("/").pop()!.replace(/\.webp$/, ""), url,
  ]),
);

/** Specific variant photos take priority over the reviewed model reference. */
export function componentImage(
  component: { slug: string; image_key: string | null },
  variant?: { image_key?: string | null },
) {
  return modelImages[variant?.image_key ?? ""]
    ?? modelImages[component.image_key ?? ""]
    ?? photosBySlug[component.slug];
}

export const modelImages: Record<string, string> = {
  ...Object.fromEntries(Object.entries(photosBySlug).map(([slug, url]) => [`catalog:${slug}`, url])),
  "catalog:marzocchi-z1-rail-black": marzocchiZ1Black,
  "catalog:marzocchi-z1-rail-red": marzocchiZ1Red,
  "catalog:magura-mt5": maguraMT5,
  "catalog:commencal-supreme-dh-v5": supremeDH,
  "catalog:fox-40-my27-black": fox40,
  "catalog:maxxis-assegai": maxxisAssegai,
  "catalog:maxxis-minion-dhr-ii": maxxisDhrII,
  "catalog:rockbros-nylon-2017-12": rockbrosNylon,
  "Fox|36 Factory": fox36Factory,
  "Fox|Float X2": foxX2,
  "Fox|34 Step-Cast": fox34StepCast,
  "RockShox|Boxxer": rockshoxBoxxer,
  "RockShox|Lyrik Ultimate": rockshoxLyrik,
  "RockShox|SID Ultimate": rockshoxSid,
  "RockShox|Super Deluxe": rockshoxSuperDeluxe,
};
