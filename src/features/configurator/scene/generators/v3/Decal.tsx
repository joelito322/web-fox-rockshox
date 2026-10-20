import { useMemo, useEffect } from "react";
import * as T from "three";
import type { Point } from "../../../model/assembly";
/** Small vector-like product lettering, generated locally without font or image requests. */
export default function Decal({
  text,
  at,
  length,
  angle = 0,
  light = false,
}: {
  text: string;
  at: Point;
  length: number;
  angle?: number;
  light?: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 1024, 128);
    ctx.fillStyle = light ? "#edece5" : "#232627";
    ctx.font = "italic 800 86px Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, 512, 68, 970);
    const t = new T.CanvasTexture(canvas);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }, [text, light]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={at} rotation={[0, 0, angle]}>
      <planeGeometry args={[length, length / 8]} />
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}
