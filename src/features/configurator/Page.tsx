import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { z } from "zod";
import { Link, useBlocker, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth/provider";
import { useCatalog, readCachedVariants } from "../catalog/api";
import {
  categoryLabels,
  selectVariant,
  type SelectedVariant,
} from "../catalog/model";
import {
  canonical,
  choose,
  configurationSchema,
  draftConfigurationSchema,
  emptyConfiguration,
  paint,
  remove,
  slotCategories,
  slotLabels,
  slots,
  warnings,
  type Configuration,
  type Slot,
  type VariantMap,
} from "./model";
import {
  readBuild,
  readCachedBuild,
  cacheSavedBuild,
  saveBuild,
} from "../garage/api";
import {
  captureSavedBuild,
  readCachedPresetPreviewSources,
} from "../bike-preview/api";
import { buildPreviewKey } from "../bike-preview/model";
import { Empty, Loading, Notice } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { MotionRegion } from "../../components/ui/MotionRegion";
import { VariantInformation } from "../catalog/VariantInformation";
const Scene = lazy(() => import("./scene/BikeScene"));
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function ConfiguratorEntry() {
  const { buildId } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const source =
    buildId ??
    `new:${params.get("preset") ?? ""}:${params.get("variant") ?? ""}`;
  return <Configurator key={`${user?.id}:${source}`} buildId={buildId} />;
}
function Configurator({ buildId }: { buildId?: string }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [id, setId] = useState(buildId ?? crypto.randomUUID());
  const [revision, setRevision] = useState(0);
  const [configuration, setConfiguration] =
    useState<Configuration>(emptyConfiguration);
  const [confirmed, setConfirmed] = useState("");
  const [variants, setVariants] = useState<VariantMap>({});
  const [slot, setSlot] = useState<Slot>("frame");
  const [previous, setPrevious] = useState<Configuration>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [visualReady, setVisualReady] = useState(false);
  const [view, setView] = useState("perspectiva");
  const [status, setStatus] = useState("");
  const [conflict, setConflict] = useState(false);
  const [intendedPiece, setIntendedPiece] = useState<SelectedVariant>();
  const [replacement, setReplacement] = useState<SelectedVariant>();
  const [signout, setSignout] = useState<null | (() => void)>(null);
  const request = useRef(0);
  const preloadTimer = useRef<number>();
  const current = useRef(configuration);
  current.current = configuration;
  const source =
    buildId ??
    `new:${params.get("preset") ?? ""}:${params.get("variant") ?? ""}`;
  const draftKey = `atlas:draft:${auth.user!.id}:${source}`;
  const signature = useMemo(() => canonical(configuration), [configuration]);
  const dirty = ready && signature !== confirmed;
  const mountWarnings = useMemo(
    () => warnings(configuration, variants),
    [configuration.items, variants],
  );
  const leaving = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !leaving.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  const [pieceFilter, setPieceFilter] = useState({ slot, search: "", page: 0 });
  // A slot change uses its clean filters immediately, before effects run.
  const pieceSearch = pieceFilter.slot === slot ? pieceFilter.search : "";
  const piecePage = pieceFilter.slot === slot ? pieceFilter.page : 0;
  const [settledSearch, setSettledSearch] = useState({
    slot,
    search: "",
    page: 0,
  });
  useEffect(() => {
    const timer = window.setTimeout(
      () => setSettledSearch({ slot, search: pieceSearch, page: piecePage }),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [slot, pieceSearch, piecePage]);
  function setPiecePage(update: number | ((value: number) => number)) {
    const next = {
      slot,
      search: pieceSearch,
      page: typeof update === "function" ? update(piecePage) : update,
    };
    setPieceFilter(next);
    setSettledSearch(next);
  }
  useEffect(() => {
    request.current++;
    window.clearTimeout(preloadTimer.current);
    setPending(false);
    setPieceFilter({ slot, search: "", page: 0 });
    setSettledSearch({ slot, search: "", page: 0 });
  }, [slot]);
  const catalog = useCatalog(
    slotCategories[slot],
    settledSearch.slot === slot ? settledSearch.search : "",
    settledSearch.slot === slot ? settledSearch.page : 0,
  );
  const item = configuration.items.find((i) => i.slot === slot);
  const selected = item ? variants[item.variantId] : undefined;
  const onUnavailable = useCallback(() => {
    setTextMode(true);
    setStatus(
      "Vista 3D no disponible. Tu montaje sigue accesible en la lista.",
    );
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      // Load the renderer alongside the data instead of after the last query.
      const sceneModule =
        "WebGLRenderingContext" in window
          ? import("./scene/BikeScene").catch(() => undefined)
          : undefined;
      try {
        let initial = emptyConfiguration();
        let baseline = canonical(initial);
        let recovered = false;
        if (buildId) {
          const b = await readCachedBuild(
            queryClient,
            auth.user!.id,
            buildId,
            controller.signal,
          );
          initial = b.configuration;
          baseline = canonical(initial);
          if (active) setRevision(b.revision);
        }
        const presetId = params.get("preset");
        if (presetId) {
          const presets = await readCachedPresetPreviewSources(
            queryClient,
            [presetId],
            controller.signal,
          );
          if (!presets[presetId]) throw new Error("preset_unavailable");
          initial = presets[presetId];
        }
        const local = localStorage.getItem(draftKey);
        if (local) {
          try {
            const saved = JSON.parse(local);
            if (
              z.uuid().safeParse(saved.id).success &&
              (!buildId || saved.id === buildId) &&
              Number.isInteger(saved.revision) &&
              saved.revision >= 0
            ) {
              initial = draftConfigurationSchema.parse(saved.configuration);
              recovered = true;
              if (active) {
                setId(saved.id);
                setRevision(saved.revision);
              }
              if (typeof saved.confirmed === "string")
                baseline = saved.confirmed;
            }
          } catch {
            localStorage.removeItem(draftKey);
          }
        }
        const all = await readCachedVariants(
          queryClient,
          [
            ...new Set([
              ...initial.items.map((i) => i.variantId),
              ...(params.get("variant") ? [params.get("variant")!] : []),
            ]),
          ],
          controller.signal,
        );
        const map = Object.fromEntries(all.map((v) => [v.id, v]));
        if (
          params.get("preset") &&
          initial.items.some((i) => !map[i.variantId]?.selectable)
        )
          throw new Error("preset_unavailable");
        const intended = all.find((v) => v.id === params.get("variant"));
        if (intended) {
          const target = slots.find(
            (s) => slotCategories[s] === intended.component.category,
          )!;
          if (
            target !== "frame" &&
            !initial.items.some((i) => i.slot === "frame")
          ) {
            if (active) {
              setIntendedPiece(intended);
              setSlot("frame");
            }
          } else if (!recovered) {
            if (
              target === "frame" ||
              initial.items.some((i) => i.slot === "frame")
            ) {
              initial = choose(initial, target, intended);
              if (active) setSlot(target);
            } else if (active) {
              setIntendedPiece(intended);
              setSlot("frame");
            }
          }
        }
        if (active) {
          setVariants(map);
          setConfiguration(initial);
          setConfirmed(baseline);
          setReady(true);
        }
        if (!("WebGLRenderingContext" in window)) {
          if (active) setTextMode(true);
        } else {
          try {
            const scene = await sceneModule;
            if (!scene) throw new Error("visual_unavailable");
            await Promise.all(
              initial.items
                .map((i) => map[i.variantId]?.visual_assets)
                .filter((a) => !!a)
                .map((a) => scene.prepareVisual(a!)),
            );
          } catch {
            if (active) onUnavailable();
          } finally {
            if (active) setVisualReady(true);
          }
        }
      } catch (e) {
        if (active) {
          setError(userError(e));
          setReady(true);
        }
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(preloadTimer.current);
      request.current++;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ id, revision, configuration, confirmed }),
      );
    } catch {
      setStatus(
        "No se pudo conservar la recuperación en este dispositivo. Guarda el montaje antes de salir.",
      );
    }
  }, [configuration, ready, draftKey, id, revision, confirmed]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  useEffect(() => {
    const leave = (event: Event) => {
      if (!dirty) return;
      const continuation = (event as CustomEvent<{ continue: () => void }>)
        .detail.continue;
      event.preventDefault();
      setSignout(() => continuation);
    };
    window.addEventListener("atlas:request-signout", leave);
    return () => window.removeEventListener("atlas:request-signout", leave);
  }, [dirty]);
  function continueLeaving() {
    leaving.current = true;
    if (signout) {
      setSignout(null);
      signout();
    } else if (blocker.state === "blocked") blocker.proceed();
  }
  function preloadPiece(variant: SelectedVariant, wait = false) {
    window.clearTimeout(preloadTimer.current);
    if (textMode || !variant.visual_assets) return;
    if (wait) {
      preloadTimer.current = window.setTimeout(
        () => preloadPiece(variant),
        120,
      );
      return;
    }
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    // Warm only an option the rider points to; never download the entire catalog.
    void import("./scene/BikeScene")
      .then((scene) => scene.prepareVisual(variant.visual_assets!))
      .catch(() => {});
  }
  async function apply(v: SelectedVariant, approved = false) {
    if (
      slot === "frame" &&
      current.current.items.some((i) => i.slot === "frame") &&
      !approved
    ) {
      setReplacement(v);
      return;
    }
    const target = slot;
    const serial = ++request.current;
    const dependencies = canonical(current.current);
    setPending(true);
    setError("");
    try {
      if (!textMode && v.visual_assets) {
        const scene = await import("./scene/BikeScene");
        await Promise.all([
          scene.prepareVisual(v.visual_assets),
          ...(target === "frame" && intendedPiece?.visual_assets
            ? [scene.prepareVisual(intendedPiece.visual_assets)]
            : []),
        ]);
      }
      if (serial !== request.current) return;
      if (canonical(current.current) !== dependencies) {
        setStatus(
          "El montaje cambió durante la carga. Vuelve a seleccionar la pieza.",
        );
        return;
      }
      let next = choose(current.current, target, v);
      const intention = target === "frame" ? intendedPiece : undefined;
      if (intention) {
        const intendedSlot = slots.find(
          (s) => slotCategories[s] === intention.component.category,
        )!;
        next = choose(next, intendedSlot, intention);
        setSlot(intendedSlot);
        setIntendedPiece(undefined);
      }
      setPrevious(current.current);
      setVariants((map) => ({
        ...map,
        [v.id]: v,
        ...(intention ? { [intention.id]: intention } : {}),
      }));
      setConfiguration(next);
      setStatus("Pieza aplicada. Cambios sin guardar.");
    } catch (e) {
      setError(userError(e));
    } finally {
      if (serial === request.current) setPending(false);
    }
  }
  async function save(copy = false) {
    if (busy) return false;
    const parsed = configurationSchema.safeParse(configuration);
    if (!parsed.success) {
      setError(
        "Escribe un nombre de hasta 80 caracteres para guardar el montaje.",
      );
      return false;
    }
    const snapshot = parsed.data;
    const signature = canonical(snapshot);
    const saveId = copy ? crypto.randomUUID() : id;
    const expected = copy ? 0 : revision;
    if (
      copy &&
      snapshot.items.some((i) => !variants[i.variantId]?.selectable)
    ) {
      setError(
        "Reemplaza o quita las piezas retiradas antes de crear una copia.",
      );
      return false;
    }
    setBusy(true);
    setError("");
    setStatus("Guardando…");
    try {
      const result = await saveBuild(saveId, expected, snapshot);
      cacheSavedBuild(queryClient, auth.user!.id, result, snapshot);
      void captureSavedBuild(
        auth.user!.id,
        result.id,
        result.revision,
        snapshot,
        variants,
      )
        .then((blob) => {
          if (blob)
            queryClient.setQueryData(
              buildPreviewKey(auth.user!.id, result.id, result.revision),
              blob,
            );
        })
        .catch(() => {});
      setId(result.id);
      setRevision(result.revision);
      setConfirmed(signature);
      setStatus(
        canonical(current.current) === signature
          ? "Guardado"
          : "Instantánea guardada. Hay cambios posteriores sin guardar.",
      );
      setConflict(false);
      void queryClient.invalidateQueries({
        queryKey: ["builds", auth.user!.id],
      });
      return true;
    } catch (e) {
      try {
        const stored = await readBuild(saveId);
        if (canonical(stored.configuration) === signature) {
          cacheSavedBuild(queryClient, auth.user!.id, stored, snapshot);
          void captureSavedBuild(
            auth.user!.id,
            stored.id,
            stored.revision,
            snapshot,
            variants,
          )
            .then((blob) => {
              if (blob)
                queryClient.setQueryData(
                  buildPreviewKey(auth.user!.id, stored.id, stored.revision),
                  blob,
                );
            })
            .catch(() => {});
          setId(stored.id);
          setRevision(stored.revision);
          setConfirmed(signature);
          setStatus("Guardado confirmado.");
          void queryClient.invalidateQueries({
            queryKey: ["builds", auth.user!.id],
          });
          return true;
        }
      } catch {
        /* The original error remains the actionable result. */
      }
      setError(userError(e));
      setStatus("Cambios sin guardar.");
      if (e && typeof e === "object" && "code" in e && e.code === "PT409")
        setConflict(true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(next: Configuration) {
    request.current++;
    setPending(false);
    setPrevious(configuration);
    setConfiguration(next);
    setStatus("Cambios sin guardar.");
  }
  async function reload() {
    if (
      !confirm("¿Recargar el montaje y descartar los cambios de esta sesión?")
    )
      return;
    try {
      const stored = await readBuild(id);
      const list = await readCachedVariants(
        queryClient,
        stored.configuration.items.map((i) => i.variantId),
      );
      if (!textMode) {
        const scene = await import("./scene/BikeScene");
        await Promise.all(
          list.flatMap((v) =>
            v.visual_assets ? [scene.prepareVisual(v.visual_assets)] : [],
          ),
        );
      }
      cacheSavedBuild(queryClient, auth.user!.id, stored, stored.configuration);
      setVariants(Object.fromEntries(list.map((v) => [v.id, v])));
      setConfiguration(stored.configuration);
      setConfirmed(canonical(stored.configuration));
      setRevision(stored.revision);
      setConflict(false);
      setError("");
    } catch (e) {
      setError(userError(e));
    }
  }
  if (!ready) return <Loading label="Preparando tu montaje" />;
  return (
    <div className="configurator">
      <div className="editor-toolbar">
        <Link className="back-link" to="/mis-bicicletas">
          <ArrowLeft size={16} /> Mis bicicletas
        </Link>
        <input
          aria-label="Nombre del montaje"
          className="build-name"
          maxLength={80}
          value={configuration.name}
          onChange={(e) =>
            setConfiguration((c) => ({ ...c, name: e.target.value }))
          }
        />
        <span className="save-status" role="status">
          {status || (dirty ? "Cambios sin guardar" : "Sin cambios")}
        </span>
        {auth.permissions.includes("builds.write_own") && (
          <button
            className="button dark small"
            disabled={busy || !configuration.name.trim()}
            onClick={() => void save()}
          >
            <Save size={16} />
            {busy ? "Guardando…" : "Guardar"}
          </button>
        )}
      </div>
      <div className="editor-layout">
        <section className="viewer" aria-label="Montaje visual">
          {configuration.items.length && !textMode ? (
            !visualReady ? (
              <Loading label="Preparando vista 3D" />
            ) : (
              <SceneBoundary onFailure={onUnavailable}>
                <Suspense fallback={<Loading label="Cargando visor" />}>
                  <Scene
                    configuration={configuration}
                    variants={variants}
                    onSelect={setSlot}
                    selectedSlot={slot}
                    view={view}
                    onUnavailable={onUnavailable}
                  />
                </Suspense>
              </SceneBoundary>
            )
          ) : (
            <Empty
              title={textMode ? "Vista 3D no disponible" : "Elige tu cuadro"}
            >
              {textMode
                ? "El montaje sigue disponible desde la lista de piezas."
                : "Una base para tu próximo camino."}
            </Empty>
          )}
          <span className="viewer-note">
            Representación aproximada · Sin certificación mecánica
          </span>
          <div className="view-controls">
            {["perspectiva", "lateral", "frontal", "superior"].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => setView(v)}
                disabled={textMode}
              >
                {v === "perspectiva"
                  ? "Restablecer"
                  : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <button onClick={() => setTextMode((v) => !v)}>
              {textMode ? "Probar vista 3D" : "Lista sin 3D"}
            </button>
          </div>
        </section>
        <aside className="editor-panel">
          <header>
            <p className="eyebrow">Tu montaje</p>
            <h1>{slotLabels[slot]}</h1>
          </header>
          <div className="slot-nav">
            {slots.map((s) => (
              <button
                className={slot === s ? "selected" : ""}
                aria-pressed={slot === s}
                key={s}
                onClick={() => setSlot(s)}
              >
                <span
                  className={
                    configuration.items.some((i) => i.slot === s)
                      ? "slot-complete"
                      : ""
                  }
                >
                  {configuration.items.some((i) => i.slot === s) ? (
                    <Check size={13} />
                  ) : (
                    <span />
                  )}
                </span>
                {slotLabels[s]}
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          {intendedPiece && (
            <p role="status">
              Elige un cuadro para probar {intendedPiece.component.name}.
            </p>
          )}
          {error && <Notice>{error}</Notice>}
          {pending && <Loading label="Preparando pieza" />}
          {selected && (
            <MotionRegion
              className="selected-piece"
              motionKey={`${slot}:${selected.id}`}
            >
              <p>{selected.component.brands.name}</p>
              <h2>{selected.component.name}</h2>
              <span>{selected.label}</span>
              <label className="field">
                Acabado
                <select
                  value={item!.finishId}
                  onChange={(e) =>
                    edit({
                      ...configuration,
                      items: configuration.items.map((i) =>
                        i.slot === slot
                          ? {
                              ...i,
                              finishId: e.target.value,
                              customColor: null,
                            }
                          : i,
                      ),
                    })
                  }
                >
                  {selected.allowed_finishes.options.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              {selected.allowed_finishes.custom_color_enabled && (
                <label className="color-field">
                  Color personalizado
                  <input
                    type="color"
                    value={
                      item?.customColor ??
                      selected.allowed_finishes.options.find(
                        (f) => f.id === item?.finishId,
                      )?.material.color ??
                      "#56634d"
                    }
                    onChange={(e) =>
                      edit(paint(configuration, slot, e.target.value, selected))
                    }
                  />
                </label>
              )}
              <details className="piece-information">
                <summary>Ficha de la pieza</summary>
                <VariantInformation
                  component={selected.component}
                  variant={selected}
                />
              </details>
              {slot !== "frame" && (
                <button
                  className="text-button"
                  onClick={() => edit(remove(configuration, slot))}
                >
                  <Trash2 size={14} /> Quitar pieza
                </button>
              )}
            </MotionRegion>
          )}
          <h2 className="panel-subtitle">
            {selected ? "Cambiar por" : "Elegir"}{" "}
            {categoryLabels[slotCategories[slot]].toLowerCase()}
          </h2>
          <label className="field">
            Buscar alternativa
            <input
              value={pieceSearch}
              onChange={(e) => {
                setPieceFilter({ slot, search: e.target.value, page: 0 });
              }}
            />
          </label>
          {catalog.isPending ? (
            <Loading />
          ) : catalog.error ? (
            <Notice onRetry={() => void catalog.refetch()}>
              No se pudieron cargar las alternativas.
            </Notice>
          ) : !catalog.data.components.length ? (
            <p className="muted">
              No hay variantes publicadas en esta categoría.
            </p>
          ) : (
            <div className="piece-options">
              {catalog.data.components.flatMap((c) =>
                c.component_variants.map((v) => (
                  <button
                    disabled={pending || item?.variantId === v.id}
                    key={v.id}
                    onPointerEnter={() =>
                      preloadPiece(selectVariant(c, v), true)
                    }
                    onPointerLeave={() =>
                      window.clearTimeout(preloadTimer.current)
                    }
                    onFocus={() => preloadPiece(selectVariant(c, v))}
                    onPointerDown={() => preloadPiece(selectVariant(c, v))}
                    onClick={() => void apply(selectVariant(c, v))}
                  >
                    <span>
                      <small>{c.brands.name}</small>
                      <strong>{c.name}</strong>
                      <span>{v.label}</span>
                    </span>
                    {item?.variantId === v.id ? (
                      <Check size={17} />
                    ) : (
                      <ChevronRight size={17} />
                    )}
                  </button>
                )),
              )}
            </div>
          )}
          {catalog.data && catalog.data.count > 24 && (
            <div className="pagination">
              <button
                className="button outline"
                disabled={!piecePage}
                onClick={() => setPiecePage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>{piecePage + 1}</span>
              <button
                className="button outline"
                disabled={(piecePage + 1) * 24 >= catalog.data.count}
                onClick={() => setPiecePage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
          {previous && (
            <button
              className="button outline full"
              onClick={() => {
                setConfiguration(previous);
                setPrevious(undefined);
                request.current++;
                setPending(false);
              }}
            >
              <RotateCcw size={16} /> Deshacer último cambio
            </button>
          )}
          <details className="mount-notes">
            <summary>
              Avisos del montaje ({mountWarnings.length})
            </summary>
            {mountWarnings.map((w) => (
              <p key={w.code}>{w.message}</p>
            ))}
          </details>
          {conflict && (
            <div className="conflict-actions">
              <button className="button outline" onClick={() => void reload()}>
                Recargar
              </button>
              <button className="button dark" onClick={() => void save(true)}>
                Guardar como copia
              </button>
            </div>
          )}
        </aside>
      </div>
      {replacement && (
        <ConfirmDialog
          title="Cambiar de cuadro"
          onCancel={() => setReplacement(undefined)}
        >
          <p>
            Se conservarán las piezas y se revisarán los avisos del montaje.
          </p>
          {dirty && auth.permissions.includes("builds.write_own") && (
            <button
              className="button dark"
              disabled={busy}
              onClick={() =>
                void save().then((ok) => {
                  if (ok) {
                    const next = replacement;
                    setReplacement(undefined);
                    void apply(next, true);
                  }
                })
              }
            >
              Guardar y cambiar
            </button>
          )}
          <button
            className="button outline"
            disabled={busy}
            onClick={() => {
              const next = replacement;
              setReplacement(undefined);
              void apply(next, true);
            }}
          >
            {dirty ? "Cambiar sin guardar" : "Cambiar cuadro"}
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setReplacement(undefined)}
          >
            Seguir con este cuadro
          </button>
        </ConfirmDialog>
      )}
      {(blocker.state === "blocked" || !!signout) && (
        <ConfirmDialog
          title="Hay cambios sin guardar"
          onCancel={() => {
            setSignout(null);
            if (blocker.state === "blocked") blocker.reset();
          }}
        >
          <p>Decide qué conservar antes de salir del montaje.</p>
          {auth.permissions.includes("builds.write_own") && (
            <button
              className="button dark"
              disabled={busy}
              onClick={() =>
                void save().then((ok) => {
                  if (
                    ok &&
                    canonical(current.current) === canonical(configuration)
                  )
                    continueLeaving();
                })
              }
            >
              Guardar y salir
            </button>
          )}
          <button
            className="button outline"
            onClick={() => {
              localStorage.removeItem(draftKey);
              continueLeaving();
            }}
          >
            Descartar y salir
          </button>
          <button
            className="text-button"
            onClick={() => {
              setSignout(null);
              if (blocker.state === "blocked") blocker.reset();
            }}
          >
            Seguir editando
          </button>
        </ConfirmDialog>
      )}
    </div>
  );
}
