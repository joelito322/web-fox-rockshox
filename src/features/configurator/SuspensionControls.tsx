import "./suspension.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Configuration, VariantMap } from "./model";
import { resolveAssembly } from "./model/assemblyV2";
import { createMotionDefinition } from "./model/suspension/kinematics";
import type { Inspection } from "./scene/SuspensionMotion";
// Keep Three.js in the lazy scene chunk; UI notifications carry no geometry/data.
const notify = () =>
  window.dispatchEvent(new Event("atlas:suspension-inspection"));
export function useSuspensionInspection(
  configuration: Configuration,
  variants: VariantMap,
) {
  const [open, setOpen] = useState(false),
    [front, setFront] = useState(0),
    [rear, setRear] = useState(0),
    [playing, setPlaying] = useState(false),
    [reduced, setReduced] = useState(false);
  const state = useRef({
    front: 0,
    rear: 0,
    playing: false,
    elapsed: 0,
    currentFront: 0,
    currentRear: 0,
  });
  const definition = useMemo(
    () =>
      createMotionDefinition(
        configuration,
        variants,
        resolveAssembly(configuration, variants),
      ),
    [configuration.items, variants],
  );
  const inspection = useMemo<Inspection | undefined>(
    () =>
      open && definition ? { definition, state: state.current } : undefined,
    [open, definition],
  );
  const reset = () => {
    Object.assign(state.current, {
      front: 0,
      rear: 0,
      playing: false,
      elapsed: 0,
      currentFront: 0,
      currentRear: 0,
    });
    setFront(0);
    setRear(0);
    setPlaying(false);
    notify();
  };
  useEffect(() => {
    reset();
  }, [definition]);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(preference.matches);
      if (preference.matches) {
        state.current.playing = false;
        state.current.front = 0;
        state.current.rear = 0;
        state.current.currentFront = 0;
        state.current.currentRear = 0;
        setPlaying(false);
        notify();
      }
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return {
    open,
    front,
    rear,
    playing,
    reduced,
    definition,
    inspection,
    reset,
    toggle() {
      reset();
      setOpen((v) => !v);
    },
    change(which: "front" | "rear", value: number) {
      const n = Math.min(1, Math.max(0, value));
      state.current.front = 0;
      state.current.rear = 0;
      state.current.currentFront = 0;
      state.current.currentRear = 0;
      state.current.elapsed = 0;
      state.current.playing = false;
      setPlaying(false);
      if (which === "front") setFront(n);
      else setRear(n);
      notify();
    },
    play() {
      if (reduced) return;
      const next = !state.current.playing;
      if (next) {
        state.current.front = front;
        state.current.rear = rear;
        state.current.elapsed = 0;
      } else {
        state.current.front = state.current.currentFront;
        state.current.rear = state.current.currentRear;
      }
      state.current.playing = next;
      setPlaying(next);
      notify();
    },
  };
}
export function SuspensionControls({
  controls,
}: {
  controls: ReturnType<typeof useSuspensionInspection>;
}) {
  const c = controls,
    d = c.definition;
  if (!c.open) return null;
  return (
    <section className="suspension-controls" aria-label="Suspensión">
      {!d ? (
        <p>Esta versión conserva su postura de referencia.</p>
      ) : (
        <>
          <label>
            Delantera{" "}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Compresión delantera"
              value={Math.round(c.front * 100)}
              disabled={!d.forkTravel || c.playing}
              onChange={(e) => c.change("front", Number(e.target.value) / 100)}
            />
            <output>{Math.round(c.front * 100)} %</output>
          </label>
          <label>
            Trasera{" "}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Compresión trasera"
              value={Math.round(c.rear * 100)}
              disabled={!d.rearAvailable || c.playing}
              onChange={(e) => c.change("rear", Number(e.target.value) / 100)}
            />
            <output>{Math.round(c.rear * 100)} %</output>
          </label>
          {!d.forkTravel && (
            <p>Añade una horquilla para mover la suspensión delantera.</p>
          )}
          {d.rearAvailable && d.pose(0, 1).rearCompression < 0.025 && (
            <p>Recorrido trasero limitado por las referencias disponibles.</p>
          )}
          {!d.rearAvailable && (
            <p>
              El mecanismo de esta combinación no permite un recorrido continuo.
            </p>
          )}
          <div>
            <button
              className="button outline small"
              onClick={c.play}
              disabled={c.reduced || (!d.rearAvailable && !d.forkTravel)}
              aria-pressed={c.playing}
            >
              {c.playing ? "Pausar" : "Reproducir"}
            </button>
            <button className="button outline small" onClick={c.reset}>
              Restablecer suspensión
            </button>
          </div>
          <small>
            {c.reduced
              ? "Movimiento reducido · Reproducción desactivada"
              : "Movimiento aproximado · Recorrido visual"}
          </small>
        </>
      )}
    </section>
  );
}
