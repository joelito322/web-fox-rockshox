import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, MoreHorizontal, Plus } from "lucide-react";
import { useBuilds, deleteBuild } from "./api";
import { BuildDetails } from "./Details";
import { useAuth } from "../auth/provider";
import { BikeIllustration } from "../../components/BikeIllustration";
import { Empty, Loading, Notice } from "../../components/ui/Feedback";
import { userError } from "../../lib/supabase";
export default function GaragePage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Math.floor(Number(params.get("page")) || 0));
  const query = useBuilds(page);
  const auth = useAuth();
  const [open, setOpen] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function remove(id: string) {
    if (!confirm("¿Eliminar esta bicicleta? Esta acción no se puede deshacer."))
      return;
    setBusy(true);
    try {
      await deleteBuild(id);
      await query.refetch();
      setOpen(undefined);
    } catch (e) {
      setError(userError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tu espacio</p>
          <h1>
            Mis bicicletas<span className="title-dot">.</span>
          </h1>
        </div>
        {auth.permissions.includes("configurator.use") && (
          <Link className="button dark" to="/bicicletas">
            <Plus size={18} /> Crear mi bicicleta
          </Link>
        )}
      </div>
      {error && <Notice>{error}</Notice>}
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Notice onRetry={() => void query.refetch()}>
          No se pudieron cargar tus bicicletas.
        </Notice>
      ) : !query.data.builds.length ? (
        <Empty title="Tu primer montaje empieza con un cuadro">
          Elige una base y combina las piezas a tu manera.
        </Empty>
      ) : (
        <div className="preset-grid">
          {query.data.builds.map((build) => (
            <article className="preset-card" key={build.id}>
              <BikeIllustration />
              <div>
                <div className="build-card-heading">
                  <h2>
                    <button
                      className="row-button"
                      onClick={() =>
                        setParams((p) => {
                          p.set("detail", build.id);
                          return p;
                        })
                      }
                    >
                      {build.name}
                    </button>
                  </h2>
                  <button
                    className="icon-button"
                    aria-label={`Opciones de ${build.name}`}
                    onClick={() =>
                      setOpen(open === build.id ? undefined : build.id)
                    }
                  >
                    <MoreHorizontal />
                  </button>
                </div>
                <p>
                  {build.part_count}{" "}
                  {build.part_count === 1 ? "pieza" : "piezas"}
                </p>
                <p>
                  Actualizada el{" "}
                  {new Intl.DateTimeFormat("es", {
                    dateStyle: "medium",
                  }).format(new Date(build.updated_at))}
                </p>
                {auth.permissions.includes("configurator.use") && (
                  <Link
                    className="button outline"
                    to={`/configurador/${build.id}`}
                  >
                    Continuar <ArrowUpRight size={18} />
                  </Link>
                )}
                {open === build.id && (
                  <div className="card-menu">
                    {auth.permissions.includes("builds.write_own") && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          setParams((p) => {
                            p.set("detail", build.id);
                            return p;
                          });
                          setOpen(undefined);
                        }}
                      >
                        Renombrar
                      </button>
                    )}
                    {auth.permissions.includes("builds.delete_own") && (
                      <button
                        disabled={busy}
                        onClick={() => void remove(build.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {query.data && query.data.count > 24 && (
        <div className="pagination">
          <button
            className="button outline"
            disabled={!page}
            onClick={() => setParams({ page: String(page - 1) })}
          >
            Anterior
          </button>
          <span>{page + 1}</span>
          <button
            className="button outline"
            disabled={(page + 1) * 24 >= query.data.count}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Siguiente
          </button>
        </div>
      )}
      {params.get("detail") && (
        <BuildDetails
          key={params.get("detail")}
          id={params.get("detail")!}
          onClose={() =>
            setParams(
              (p) => {
                p.delete("detail");
                return p;
              },
              { replace: true },
            )
          }
        />
      )}
    </div>
  );
}
