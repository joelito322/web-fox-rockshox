import { useState, Suspense, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import * as T from "three";
import reportV5 from "../../models/catalog-v5/exports/manifest.json";
import reportV6 from "../../models/catalog-v6/exports/manifest.json";
const generation =
  new URLSearchParams(location.search).get("generation") === "v6" ? "v6" : "v5";
const report: Record<
  string,
  {
    file: string;
    model: string;
    category: string;
    triangles: number;
    meshes: number;
    anchors: Record<string, number[]>;
  }
> = generation === "v6" ? reportV6 : reportV5;
import referenceData from "../../models/catalog-v5/references.json";
type Reference = {
  url: string;
  width: number;
  height: number;
  landmarks?: Record<string, number[]>;
};
const references = referenceData as Record<string, Reference>;
const rows = Object.entries(report),
  representatives = rows.filter(
    ([, r], i) => rows.findIndex(([, x]) => x.model === r.model) === i,
  );
type Row = (typeof rows)[number][1];
function Model({ file }: { file: string }) {
  const { scene } = useGLTF(
    "/models/catalog-" + generation + "/exports/" + file,
  );
  return <primitive object={scene} />;
}
// Register measured frame coordinates to the three source-image landmarks. This
// is an analytical affine comparison, not a claim that an oblique photo is CAD.
function registration(row: Row, reference: Reference) {
  const p = reference.landmarks!,
    b = p.bottom_bracket,
    h = p.head_top,
    r = p.rear_axle;
  const anchors = row.anchors as Record<string, number[]>;
  const H = anchors.head_tube,
    R = anchors.rear_axle;
  const determinant = H[0] * R[1] - R[0] * H[1];
  const ux = h[0] - b[0],
    uy = b[1] - h[1],
    vx = r[0] - b[0],
    vy = b[1] - r[1];
  return new T.Matrix4().set(
    (ux * R[1] - vx * H[1]) / determinant,
    (-ux * R[0] + vx * H[0]) / determinant,
    0,
    b[0],
    (uy * R[1] - vy * H[1]) / determinant,
    (-uy * R[0] + vy * H[0]) / determinant,
    0,
    reference.height - b[1],
    0,
    0,
    1000,
    0,
    0,
    0,
    0,
    1,
  );
}
function Camera({
  row,
  reference,
  registered,
}: {
  row: Row;
  reference?: Reference;
  registered: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const c = camera as T.OrthographicCamera;
    if (registered && reference) {
      const ratio = size.width / size.height,
        w = Math.max(reference.width, reference.height * ratio),
        h = w / ratio;
      c.left = -w / 2;
      c.right = w / 2;
      c.top = h / 2;
      c.bottom = -h / 2;
      c.near = 0.1;
      c.far = 20000;
      c.zoom = 1;
      c.position.set(reference.width / 2, reference.height / 2, 5000);
      c.lookAt(reference.width / 2, reference.height / 2, 0);
      c.updateProjectionMatrix();
    } else {
      const view = new URLSearchParams(location.search).get("camera");
      const views: Record<string, [number, number, number]> = {
        right: [0, 0.2, 3],
        left: [0, 0.2, -3],
        front: [3, 0.2, 0],
        top: [0, 3, 0.001],
        bottom: [0, -3, 0.001],
        diagonal: [2, 1, 2],
        opposite: [-2, 0.8, -2],
      };
      c.position.set(
        ...(views[view ?? ""] ??
          (row.category === "fork" ? [3, 0.2, 0] : [0, 0.2, 3])),
      );
      c.lookAt(0, 0.2, 0);
    }
    invalidate();
  }, [camera, size.width, size.height, row, reference, registered, invalidate]);
  return null;
}
function App() {
  const [id, setId] = useState(representatives[0][0]);
  const [mode, setMode] = useState<"model" | "reference" | "overlay">("model");
  const [spatial, setSpatial] = useState(true);
  const [opacity, setOpacity] = useState(0.55);
  const row = report[id as keyof typeof report],
    reference = references[row.model];
  const registered = Boolean(reference?.landmarks) && !spatial;
  const matrix = useMemo(
    () => (registered ? registration(row, reference) : new T.Matrix4()),
    [row, reference, registered],
  );
  const labels: Record<string, string> = {
    frame: "Cuadro",
    fork: "Horquilla",
    shock: "Amortiguador",
  };
  return (
    <main
      style={{
        background: "#dfe2d8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        font: "14px system-ui",
        color: "#223025",
      }}
    >
      <header
        style={{
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <b>ATLAS · Revisión de forma</b>
        <select
          aria-label="Modelo"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setMode("model");
            setSpatial(true);
          }}
        >
          {representatives.map(([id, r]) => (
            <option key={id} value={id}>
              {labels[r.category]} · {r.model}
            </option>
          ))}
        </select>
        <button
          aria-pressed={mode === "reference"}
          disabled={!reference}
          onClick={() => {
            setMode("reference");
            setSpatial(false);
          }}
        >
          Referencia
        </button>
        <button
          aria-pressed={mode === "model" && !spatial}
          onClick={() => {
            setMode("model");
            setSpatial(false);
          }}
        >
          Modelo
        </button>
        <button
          disabled={!reference?.landmarks}
          aria-pressed={mode === "overlay"}
          onClick={() => {
            setMode("overlay");
            setSpatial(false);
          }}
        >
          Superposición
        </button>
        <button
          aria-pressed={spatial}
          onClick={() => {
            setMode("model");
            setSpatial(true);
          }}
        >
          3D
        </button>
      </header>
      <section
        aria-label="Revisión del modelo"
        style={{ position: "relative", height: "72vh", minHeight: 300 }}
      >
        {mode !== "model" && reference && (
          <img
            src={reference.url}
            alt="Referencia del modelo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        )}
        {mode !== "reference" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: mode === "overlay" ? opacity : 1,
            }}
          >
            <Canvas
              key={`${id}-${registered}`}
              orthographic
              camera={{ position: [0, 0.2, 3], zoom: 500 }}
              dpr={1}
              gl={{ alpha: true }}
              frameloop="demand"
            >
              <ambientLight intensity={1.6} />
              <directionalLight position={[1, 3, 4]} intensity={3} />
              <directionalLight position={[-2, 0, -3]} intensity={2} />
              <Camera row={row} reference={reference} registered={registered} />
              <Suspense fallback={null}>
                {registered ? (
                  <group matrix={matrix} matrixAutoUpdate={false}>
                    <Model file={row.file} />
                  </group>
                ) : (
                  <Bounds fit clip observe margin={1.25}>
                    <Model file={row.file} />
                  </Bounds>
                )}
              </Suspense>
              {spatial && <OrbitControls makeDefault />}
            </Canvas>
          </div>
        )}
      </section>
      {mode === "overlay" && (
        <label style={{ padding: 12, textAlign: "center" }}>
          Opacidad{" "}
          <input
            aria-label="Opacidad"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
      )}
      <footer style={{ padding: 16, lineHeight: 1.5 }}>
        {row.triangles.toLocaleString()} triángulos · {row.meshes} materiales.{" "}
        {registered
          ? "Contorno registrado a la fotografía; perspectiva y profundidad estimadas."
          : "Arrastra para girar. Las superficies ocultas siguen siendo aproximadas."}
        <br />
        Superposición disponible para los ocho cuadros; las fotografías de
        suspensión se revisan por separado.{" "}
        <a href="/tests/fixtures/reference-review.html">Conjunto aprobado</a>
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
