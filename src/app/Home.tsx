import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import alpine from "../assets/images/landing/alpine-wide.webp";
import alpineMobile from "../assets/images/landing/alpine-mobile.webp";
import airtime from "../assets/images/landing/airtime-wide.webp";
import airtimeMobile from "../assets/images/landing/airtime-mobile.webp";
import lines from "../assets/images/landing/lines-wide.webp";
import linesMobile from "../assets/images/landing/lines-mobile.webp";
import "./home.css";

const photos = [
  { src: alpine, mobile: alpineMobile, name: "Salto alpino", alt: "Ciclista suspendido en un salto sobre una ladera, con la cordillera de los Alpes al fondo", author: "Nathanaël Desmeules", url: "https://unsplash.com/photos/XpB8y73sEEw", position: "50% 25%", portrait: true },
  { src: airtime, mobile: airtimeMobile, name: "Aire libre", alt: "Ciclista realizando un salto lateral sobre un gran desnivel en Sun Peaks, rodeado de bosque y cielo abierto", author: "Julien Kettmann", url: "https://unsplash.com/photos/534Moyd3Lf4", position: "55% 40%" },
  { src: lines, mobile: linesMobile, name: "Líneas desde arriba", alt: "Vista aérea de un ciclista recorriendo una curva entre árboles dorados y largas sombras en Haldon Forest", author: "Red Zeppelin", url: "https://unsplash.com/photos/lVq9vpdjfrU", position: "50% 60%", portrait: true },
];
const period = 6000;
export default function Home() {
  const region = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [mounted, setMounted] = useState([0]);
  const [ready, setReady] = useState<number[]>([]);
  const [failed, setFailed] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const available = photos.map((_, i) => i).filter(i => !failed.includes(i));
  const activeReady = ready.includes(active);

  function change(direction: number) {
    if (available.length < 2) return;
    const position = Math.max(0, available.indexOf(active));
    setActive(available[(position + direction + available.length) % available.length]);
  }
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    if (region.current) observer.observe(region.current);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    setMounted(current => current.includes(active) ? current : [...current, active]);
  }, [active]);
  useEffect(() => {
    if (!activeReady || !visible || !inView || reduced) return;
    // Prepare only the next photograph after the initial image has been displayed.
    const next = available[(available.indexOf(active) + 1) % available.length];
    if (next == null) return;
    const timer = setTimeout(() => setMounted(current => current.includes(next) ? current : [...current, next]), 900);
    return () => clearTimeout(timer);
  }, [active, activeReady, visible, inView, reduced, failed]);
  useEffect(() => {
    if (paused || reduced || interacting || focused || !visible || !inView || !activeReady || available.length < 2) return;
    const timer = setTimeout(() => change(1), period);
    return () => clearTimeout(timer);
  }, [active, paused, reduced, interacting, focused, visible, inView, activeReady, failed]);
  useEffect(() => {
    if (ready.includes(active) && !failed.includes(active)) setDisplayed(active);
    if (failed.includes(active)) {
      const next = photos.findIndex((_, i) => !failed.includes(i));
      if (next >= 0) setActive(next);
    }
  }, [active, ready, failed]);
  function imageFailed(index: number) {
    setFailed(current => current.includes(index) ? current : [...current, index]);
  }
  return (
    <section
      className={`landing campaign${paused || reduced || interacting || focused || !visible || !inView ? " is-paused" : ""}`}
      ref={region}
      aria-label="ATLAS MTB: enduro y descenso"
      onPointerEnter={event => { if (event.pointerType === "mouse") setInteracting(true); }}
      onPointerLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <div className="campaign-photos" role="region" aria-roledescription="carrusel" aria-label="Fotografías de enduro y descenso">
        {mounted.map(index => {
          const photo = photos[index];
          const shown = displayed === index && ready.includes(index) && !failed.includes(index);
          return (
            <picture key={photo.src} aria-hidden={!shown} className={`campaign-photo${shown ? " is-active" : ""}${photo.portrait ? " is-portrait" : ""}`} style={{ "--photo-position": photo.position } as CSSProperties}>
              <source media="(max-width: 760px)" srcSet={photo.mobile} />
              <img src={photo.src} alt={photo.alt} fetchPriority={index === 0 ? "high" : "low"} decoding="async" onLoad={async event => {
                const image = event.currentTarget;
                try {
                  await image.decode();
                  if (image.isConnected) setReady(current => current.includes(index) ? current : [...current, index]);
                } catch { imageFailed(index); }
              }} onError={() => imageFailed(index)} />
            </picture>
          );
        })}
      </div>
      <div className="campaign-shade" aria-hidden="true" />
      <div className="campaign-edge" aria-hidden="true"><span /> <span /> <span /></div>
      <div className="landing-copy">
        <p className="eyebrow"><span className="campaign-slash" /> Enduro / Descenso</p>
        <h1><span>Cada pieza</span>{" "}<span>define tu</span>{" "}<em>camino.</em></h1>
        <p className="landing-description">Tu bici. Tus reglas.</p>
        <div className="campaign-actions">
          <Link className="button accent" to="/configurador">Crear mi bicicleta <ArrowUpRight size={22} /></Link>
          <Link className="landing-secondary" to="/componentes">Explorar componentes <ArrowRight size={17} /></Link>
        </div>
      </div>
      <div className="campaign-bottom">
        <div className="campaign-signoff"><span className="campaign-slash" aria-hidden="true" /> Tierra adentro.</div>
        <div className="campaign-navigation" aria-label="Controles de fotografías">
          <span className="campaign-count" aria-hidden="true">{String(displayed + 1).padStart(2, "0")} <span>/ 03</span></span>
          <div className="campaign-dots">
            {photos.map((photo, index) => <button key={photo.name} aria-label={`Ver foto ${index + 1}: ${photo.name}`} aria-pressed={displayed === index} disabled={failed.includes(index)} onClick={() => setActive(index)}><span /></button>)}
          </div>
          <button className="campaign-control" aria-label="Fotografía anterior" disabled={available.length < 2} onClick={() => change(-1)}><ArrowLeft size={20} /></button>
          {!reduced && <button className="campaign-control" aria-label={paused ? "Reproducir fotografías" : "Pausar fotografías"} aria-pressed={paused} disabled={available.length < 2} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}
          <button className="campaign-control" aria-label="Fotografía siguiente" disabled={available.length < 2} onClick={() => change(1)}><ArrowRight size={20} /></button>
        </div>
      </div>
      {ready.includes(displayed) && !failed.includes(displayed) && <a className="campaign-credit" href={photos[displayed].url} target="_blank" rel="noreferrer">Foto: {photos[displayed].author} / Unsplash <ArrowUpRight size={11} /></a>}
    </section>
  );
}
