import { Compatibility } from "./Compatibility";
import "./assembly.css";
import { AssemblyIndex, AssemblyNavigation } from "./AssemblyNavigation";
import { FinishPalette } from "./FinishPalette";
import {
  counterpart,
  entryFor,
  pairedSlot,
  wheelBSD,
  wheelFilters,
  chooseTogether,
  type WheelSetup,
} from "./model/guided";
import {
  SuspensionControls,
  useSuspensionInspection,
} from "./SuspensionControls";
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
import {
  useCatalog,
  readCachedVariants,
  readCachedComponent,
} from "../catalog/api";
import { selectVariant, type SelectedVariant } from "../catalog/model";
import {
  canonical,
  choose,
  configurationSchema,
  draftConfigurationSchema,
  emptyConfiguration,
  remove,
  slotCategories,
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
  const [highlightedSlot, setHighlightedSlot] = useState<Slot>();
  const selectSlot = useCallback((next: Slot) => {
    setSlot(next);
    setHighlightedSlot(next);
  }, []);
  const clearHighlight = useCallback(() => setHighlightedSlot(undefined), []);
  const [frameSize, setFrameSize] = useState("all");
  const [selectionNote, setSelectionNote] = useState("");
  const [wheelSetup, setWheelSetup] = useState<WheelSetup>("all");
  const [pairing, setPairing] = useState<Record<string, boolean>>({});
  const linked = pairing[slotCategories[slot]] !== false;
  const [previous, setPrevious] = useState<Configuration>();
  const suspension = useSuspensionInspection(configuration, variants);
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
    () => warnings(configuration, variants).filter((w) => w.code !== "visual_reference"),
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
    setSelectionNote("");
  }, [slot]);
  const selectionSpecs = {
    ...wheelFilters(wheelSetup, slot),
    ...(slot === "frame" && frameSize !== "all"
      ? { size_label: frameSize }
      : {}),
  };
  const catalog = useCatalog(
    slotCategories[slot],
    settledSearch.slot === slot ? settledSearch.search : "",
    settledSearch.slot === slot ? settledSearch.page : 0,
    Object.keys(selectionSpecs).length ? { specs: selectionSpecs } : {},
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
      slot !== "frame" &&
      !current.current.items.some((i) => i.slot === "frame")
    ) {
      setIntendedPiece(v);
      setSlot("frame");
      return;
    }

    if (
      slot === "frame" &&
      current.current.items.some((i) => i.slot === "frame") &&
      !approved
    ) {
      setReplacement(v);
      return;
    }
    const target = slot;
    const otherSlot = linked ? pairedSlot(target) : undefined;
    const serial = ++request.current;
    const dependencies = canonical(current.current);
    setPending(true);
    setError("");
    setSelectionNote("");
    try {
      const choices = [{ slot: target, variant: v }];
      if (otherSlot) {
        const wantedBSD = wheelBSD(wheelSetup, otherSlot);
        let other = v;
        if (
          ["rim", "tire"].includes(v.component.category) &&
          wantedBSD &&
          wantedBSD !== v.specs.wheel_bsd_mm
        ) {
          const component = await readCachedComponent(
            queryClient,
            v.component.slug,
          );
          const equivalent = counterpart(
            v,
            wantedBSD,
            component.component_variants.map((option) =>
              selectVariant(component, option),
            ),
          );
          if (!equivalent) {
            if (serial === request.current) {
              const message =
                "No hay una variante equivalente para la otra rueda. Desactiva «Aplicar a ambos lados» y elige cada lado por separado.";
              setStatus("Selección sin aplicar.");
              setSelectionNote(message);
            }
            return;
          }
          other = equivalent;
        }
        choices.push({ slot: otherSlot, variant: other });
      }
      if (!textMode && v.visual_assets) {
        const scene = await import("./scene/BikeScene");
        await Promise.all([
          ...choices.map((choice) =>
            scene.prepareVisual(choice.variant.visual_assets!),
          ),
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
      let next = chooseTogether(current.current, choices);
      setHighlightedSlot(target);
      const intention = target === "frame" ? intendedPiece : undefined;
      if (intention) {
        const intendedSlot = slots.find(
          (s) => slotCategories[s] === intention.component.category,
        )!;
        next = choose(next, intendedSlot, intention);
        selectSlot(intendedSlot);
        setIntendedPiece(undefined);
      }
      setPrevious(current.current);
      setVariants((map) => ({
        ...map,
        ...Object.fromEntries(
          choices.map((choice) => [choice.variant.id, choice.variant]),
        ),
        ...(intention ? { [intention.id]: intention } : {}),
      }));
      setConfiguration(next);
      setStatus(
        otherSlot
          ? "Piezas aplicadas delante y detrás. Cambios sin guardar."
          : "Pieza aplicada. Cambios sin guardar.",
      );
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
  function finish(id?: string, color?: string) {
    if (!selected || !item) return;
    const targets = [
      slot,
      ...(linked && pairedSlot(slot) ? [pairedSlot(slot)!] : []),
    ];
    const sourceFinish = selected.allowed_finishes.options.find(
      (f) => f.id === id,
    );
    const installed = configuration.items.filter((i) =>
      targets.includes(i.slot),
    );
    const changed = installed.map((i) => {
      const variant = variants[i.variantId];
      if (!variant) return null;
      if (color)
        return variant.allowed_finishes.custom_color_enabled
          ? { ...i, customColor: color.toUpperCase() }
          : null;
      const match =
        variant.allowed_finishes.options.find(
          (f) =>
            f.id === id &&
            f.label === sourceFinish?.label &&
            f.material.color === sourceFinish?.material.color,
        ) ??
        variant.allowed_finishes.options.find(
          (f) =>
            f.label === sourceFinish?.label &&
            f.material.color === sourceFinish?.material.color,
        );
      return match ? { ...i, finishId: match.id, customColor: null } : null;
    });
    if (changed.some((i) => !i)) {
      const message =
        "Este acabado no está disponible en ambos lados. Desactiva la selección conjunta para cambiar una pieza.";
      setStatus("Acabado sin aplicar.");
      setSelectionNote(message);
      return;
    }
    setSelectionNote("");
    edit({
      ...configuration,
      items: configuration.items.map(
        (i) => changed.find((c) => c?.slot === i.slot) ?? i,
      ),
    });
  }
  function changeFrameSize(size: string) {
    request.current++;
    setPending(false);
    setFrameSize(size);
    setSelectionNote("");
    setPieceFilter({ slot, search: pieceSearch, page: 0 });
    setSettledSearch({ slot, search: pieceSearch, page: 0 });
  }
  function changeWheelSetup(setup: WheelSetup) {
    request.current++;
    setPending(false);
    setWheelSetup(setup);
    setSelectionNote("");
    setPieceFilter({ slot, search: pieceSearch, page: 0 });
    setSettledSearch({ slot, search: pieceSearch, page: 0 });
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
      <Compatibility warnings={mountWarnings} hasParts={configuration.items.length > 0} onSelect={selectSlot} />
      <div className="editor-layout">
        <AssemblyIndex
          configuration={configuration}
          variants={variants}
          slot={slot}
          warnings={mountWarnings}
          onSelect={selectSlot}
        />
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
                    onSelect={selectSlot}
                    selectedSlot={highlightedSlot}
                    onDeselect={clearHighlight}
                    view={view}
                    onUnavailable={onUnavailable}
                    inspection={suspension.inspection}
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
            <button
              aria-pressed={suspension.open}
              onClick={suspension.toggle}
              disabled={
                textMode || !configuration.items.some((i) => i.slot === "frame")
              }
            >
              Suspensión
            </button>
            <button
              onClick={() => {
                suspension.reset();
                setTextMode((v) => !v);
              }}
            >
              {textMode ? "Probar vista 3D" : "Lista sin 3D"}
            </button>
          </div>
          {!textMode && <SuspensionControls controls={suspension} />}
        </section>
        <aside className="editor-panel">
          <AssemblyNavigation
            slot={slot}
            onSelect={selectSlot}
            wheelSetup={wheelSetup}
            onWheelSetup={changeWheelSetup}
            frameSize={frameSize}
            onFrameSize={changeFrameSize}
            linked={linked}
            onLinked={(value) => {
              request.current++;
              setPending(false);
              setSelectionNote("");
              setPairing((previous) => ({
                ...previous,
                [slotCategories[slot]]: value,
              }));
            }}
          />
          <header
            id="assembly-selection"
            tabIndex={-1}
            className="assembly-active-heading"
          >
            <h1>{entryFor(slot).label}</h1>
          </header>
          {intendedPiece && (
            <p role="status">
              Elige un cuadro para probar {intendedPiece.component.name}.
            </p>
          )}
          {error && <Notice>{error}</Notice>}
          {selectionNote && (
            <p className="assembly-notice" role="status">
              {selectionNote}
            </p>
          )}
          {pending && <Loading label="Preparando pieza" />}
          {selected && (
            <MotionRegion
              className="selected-piece"
              motionKey={`${slot}:${selected.id}`}
            >
              <p>{selected.component.brands.name}</p>
              <h2>{selected.component.name}</h2>
              <span>{selected.label}</span>
              <FinishPalette
                variant={selected}
                item={item!}
                onFinish={(id) => finish(id)}
                onColor={(color) => finish(undefined, color)}
              />
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
                  onClick={() => {
                    const targets = [
                      slot,
                      ...(linked && pairedSlot(slot)
                        ? [pairedSlot(slot)!]
                        : []),
                    ];
                    edit(
                      targets.reduce(
                        (next, target) => remove(next, target),
                        configuration,
                      ),
                    );
                  }}
                >
                  <Trash2 size={14} />{" "}
                  {linked && pairedSlot(slot)
                    ? "Quitar de ambos lados"
                    : "Quitar pieza"}
                </button>
              )}
            </MotionRegion>
          )}
          <h2 className="panel-subtitle">
            {selected ? "Alternativas" : "Elegir pieza"}
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
              No hay opciones con estos filtros. Prueba otra medida o selecciona
              Todas.
            </p>
          ) : (
            <div className="piece-options">
              {catalog.data.components.flatMap((c) =>
                c.component_variants.map((v) => (
                  <button
                    disabled={
                      pending || (slot === "frame" && item?.variantId === v.id)
                    }
                    aria-pressed={item?.variantId === v.id}
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
