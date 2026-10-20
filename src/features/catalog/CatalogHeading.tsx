import type { ReactNode } from "react";
import fork from "../../assets/images/catalog/fox-38-factory-my27.webp";
import rotor from "../../assets/images/catalog/sram-hs2.webp";
import riding from "../../assets/images/landing/airtime-wide.webp";
import ridingMobile from "../../assets/images/landing/airtime-mobile.webp";
import "./discovery.css";

export function CatalogHeading({ kind, children }: {
  kind: "components" | "bicycles";
  children?: ReactNode;
}) {
  const bicycles = kind === "bicycles";
  return (
    <div className={`section-heading discovery-heading discovery-heading--${kind}`}>
      <div className="discovery-heading-copy">
        <p className="eyebrow">Enduro / Descenso</p>
        <h1>{bicycles ? "Bicicletas" : "Componentes"}<span className="title-dot">.</span></h1>
        <p className="discovery-description">{bicycles ? "Encuentra tu línea. Hazla tuya." : "El carácter está en los detalles."}</p>
      </div>
      <div className="discovery-heading-visual" aria-hidden="true">
        {bicycles ? <picture>
          <source media="(max-width: 760px)" srcSet={ridingMobile} />
          <img className="discovery-riding" src={riding} alt="" />
        </picture> : <>
          <img className="discovery-fork" src={fork} alt="" />
          <img className="discovery-rotor" src={rotor} alt="" />
        </>}
      </div>
      {children && <div className="discovery-heading-action">{children}</div>}
    </div>
  );
}
