import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/provider";
import { readCachedBuild, cacheSavedBuild, saveBuild } from "./api";
import { readCachedVariants } from "../catalog/api";
import { captureSavedBuild } from "../bike-preview/api";
import { buildPreviewKey } from "../bike-preview/model";
import { VariantInformation } from "../catalog/VariantInformation";
import { slotLabels } from "../configurator/model";
import { Drawer } from "../../components/ui/Drawer";
import { useUnsavedChanges } from "../../components/ui/UnsavedChanges";
import { Loading, Notice } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
export function BuildDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const auth = useAuth(),
    cache = useQueryClient();
  const [name, setName] = useState(""),
    [baseline, setBaseline] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const initialized = useRef(false);
  const query = useQuery({
    queryKey: ["build-detail", auth.user!.id, id],
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const build = await readCachedBuild(cache, auth.user!.id, id, signal),
        variants = await readCachedVariants(
          cache,
          build.configuration.items.map((i) => i.variantId),
          signal,
        );
      return { ...build, variants };
    },
  });
  useEffect(() => {
    if (query.data && !initialized.current) {
      initialized.current = true;
      setName(query.data.name);
      setBaseline(query.data.name);
    }
  }, [query.data]);
  const guard = useUnsavedChanges(
    initialized.current && name !== baseline,
    save,
    busy,
  );
  async function save() {
    if (!query.data || busy || !name.trim() || name.trim().length > 80)
      return false;
    setBusy(true);
    setError("");
    try {
      const previousPreview = cache.getQueryData<Blob>(
        buildPreviewKey(auth.user!.id, id, query.data.revision),
      );
      const configuration = {
        ...query.data.configuration,
        name: name.trim(),
      };
      const header = await saveBuild(id, query.data.revision, configuration);
      cacheSavedBuild(cache, auth.user!.id, header, configuration);
      cache.setQueryData(["build-detail", auth.user!.id, id], {
        ...query.data,
        ...header,
        configuration,
      });
      void cache.invalidateQueries({ queryKey: ["builds", auth.user!.id] });
      const user = auth.user!.id;
      void captureSavedBuild(
        user,
        id,
        header.revision,
        configuration,
        Object.fromEntries(query.data.variants.map((v) => [v.id, v])),
        previousPreview,
      )
        .then((blob) => {
          if (blob)
            cache.setQueryData(
              buildPreviewKey(user, id, header.revision),
              blob,
            );
        })
        .catch(() => {});
      setName(name.trim());
      setBaseline(name.trim());
      setMessage("Nombre actualizado.");
      return true;
    } catch (e) {
      setError(userError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Drawer title="Mi bicicleta" onClose={() => guard.request(onClose)}>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <Notice onRetry={() => void query.refetch()}>
            No se pudo cargar el montaje.
          </Notice>
        ) : (
          <>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void save();
              }}
            >
              <label className="field">
                Nombre
                <input
                  value={name}
                  maxLength={80}
                  required
                  disabled={!auth.permissions.includes("builds.write_own")}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              {auth.permissions.includes("builds.write_own") && (
                <button
                  className="button dark"
                  disabled={busy || name === baseline || !name.trim()}
                >
                  {busy ? "Guardando…" : "Guardar cambios"}
                </button>
              )}
            </form>
            <p className="muted">
              {query.data.configuration.items.length} piezas · Guardada el{" "}
              {new Date(query.data.updated_at).toLocaleDateString("es")}
            </p>
            {auth.permissions.includes("configurator.use") && (
              <Link className="button outline full" to={`/configurador/${id}`}>
                Continuar montaje
              </Link>
            )}
            {query.data.configuration.items.map((item) => {
              const variant = query.data.variants.find(
                (v) => v.id === item.variantId,
              );
              return (
                <details key={item.slot} className="piece-information">
                  <summary>
                    {slotLabels[item.slot]}
                    {variant ? ` · ${variant.component.name}` : ""}
                  </summary>
                  {variant ? (
                    <>
                      <p className="eyebrow">{variant.component.brands.name}</p>
                      <h3>{variant.component.name}</h3>
                      <p>{variant.label}</p>
                      <p>
                        {variant.allowed_finishes.options.find(
                          (f) => f.id === item.finishId,
                        )?.label ?? "Acabado guardado"}
                        {item.customColor ? " · Color personalizado" : ""}
                      </p>
                      {item.customColor && (
                        <span
                          className="saved-color"
                          style={{ background: item.customColor }}
                          aria-label="Color personalizado guardado"
                        />
                      )}
                      {!variant.selectable && (
                        <p className="muted">
                          Retirada de nuevos montajes; conservada en tu
                          bicicleta.
                        </p>
                      )}
                      <VariantInformation
                        component={variant.component}
                        variant={variant}
                      />
                    </>
                  ) : (
                    <Notice>
                      No se pudo resolver esta referencia. Se conserva la
                      selección guardada.
                    </Notice>
                  )}
                </details>
              );
            })}
          </>
        )}
        {message && <p role="status">{message}</p>}
        {error && <Notice>{error}</Notice>}
      </Drawer>
      {guard.dialog}
    </>
  );
}
