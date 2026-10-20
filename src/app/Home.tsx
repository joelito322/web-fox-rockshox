import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BikeIllustration } from "../components/BikeIllustration";
export default function Home() {
  return (
    <section className="landing">
      <div className="landing-copy">
        <p className="eyebrow">
          <span className="live-dot" /> Enduro / Descenso
        </p>
        <h1>
          Cada pieza
          <br />
          define tu
          <br />
          <em>camino.</em>
        </h1>
        <p className="landing-description">Tu próximo montaje empieza aquí.</p>
        <Link className="button accent" to="/configurador">
          Crear mi bicicleta <ArrowUpRight size={20} />
        </Link>
        <Link className="landing-secondary" to="/componentes">
          Explorar componentes <ArrowRight size={16} />
        </Link>
      </div>
      <div className="landing-visual">
        <span className="visual-word" aria-hidden="true">
          RIDE.
        </span>
        <BikeIllustration />
        <div className="visual-caption">
          <span>ATLAS STUDIO / 01</span>
          <span>Representación aproximada</span>
        </div>
      </div>
      <div className="landing-bottom">
        <span>Tu bicicleta. A tu manera.</span>
        <span>01 — Elige. Combina. Visualiza.</span>
      </div>
    </section>
  );
}
