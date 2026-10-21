import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { canonical, type Configuration } from "../configurator/model";
import { useAuth } from "../auth/provider";
import {
  getBuildPreview,
  getPresetPreview,
  readPresetPreviewSource,
} from "./api";
import { buildPreviewKey, previewVersion } from "./model";
import "./preview.css";
function useVisible() {
  const ref = useRef<HTMLSpanElement>(null),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  return { ref, visible };
}
function Image({ blob, name }: { blob?: Blob | null; name: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl("");
    if (!blob) return;
    const address = URL.createObjectURL(blob);
    setUrl(address);
    return () => URL.revokeObjectURL(address);
  }, [blob]);
  return url ? (
    <img
      className="bike-preview-image"
      src={url}
      alt={`Montaje guardado de ${name}`}
      decoding="async"
    />
  ) : null;
}
export function SavedBuildPreview({
  id,
  revision,
  count,
  name,
}: {
  id: string;
  revision: number;
  count: number;
  name: string;
}) {
  const auth = useAuth(),
    client = useQueryClient(),
    { ref, visible } = useVisible();
  const query = useQuery({
    queryKey: buildPreviewKey(auth.user?.id ?? "", id, revision),
    enabled:
      visible &&
      count > 0 &&
      !!auth.user &&
      auth.permissions.includes("builds.read_own"),
    staleTime: 300000,
    retry: false,
    queryFn: ({ signal }) =>
      getBuildPreview(
        auth.user!.id,
        id,
        revision,
        auth.permissions.includes("builds.write_own"),
        signal,
        client,
      ),
  });
  return (
    <span
      ref={ref}
      className="bike-preview"
      data-preview-state={
        count === 0 ? "empty" : query.data ? "ready" : "pending"
      }
    >
      <Image
        key={`${auth.user?.id}:${id}:${revision}`}
        blob={count ? query.data : null}
        name={name}
      />
    </span>
  );
}
export function PresetPreview({
  id,
  name,
  source,
}: {
  id: string;
  name: string;
  source?: Configuration | null;
}) {
  const auth = useAuth(),
    client = useQueryClient(),
    { ref, visible } = useVisible();
  const signature = source
    ? canonical({ ...source, name: "Preview" })
    : "load-source";
  const query = useQuery({
    queryKey: ["preset-preview", id, signature, previewVersion],
    enabled: visible && source !== null,
    staleTime: 300000,
    retry: false,
    queryFn: async ({ signal }) => {
      const configuration =
        source ?? (await readPresetPreviewSource(id, signal));
      return getPresetPreview(
        id,
        configuration,
        auth.permissions.includes("presets.manage") &&
          auth.permissions.includes("presets.publish"),
        signal,
        client,
      );
    },
  });
  return (
    <span
      ref={ref}
      className="bike-preview"
      data-preview-state={query.data ? "ready" : "pending"}
    >
      <Image key={`${id}:${signature}`} blob={query.data} name={name} />
    </span>
  );
}
