import { featureWindows, filterOptions, knowledgeBlocks, suspensionCatalog } from '../data/suspension'
import atlasLogo from '../assets/atlas-mtb.svg'
import { modelImages } from '../data/images'
import { makeSlug } from '../utils/routing'
import { useContext } from 'react'
import { CompareContext } from '../context/CompareContext'

export default function Home() {
  const compareContext = useContext(CompareContext)

  if (!compareContext) {
    return <div>Loading...</div>
  }

  const { addToCompare } = compareContext

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div className="logo-block">
            <img className="logo-mark" src={atlasLogo} alt="Atlas MTB" />
            <div>
              <p className="eyebrow">Atlas MTB</p>
              <p className="logo-sub">Base de conocimiento MTB</p>
            </div>
          </div>
          <span className="pill">Actualizado semanalmente</span>
        </div>
        <h1>Suspension MTB organizada por marca, recorrido y sensacion.</h1>
        <p className="lede">
          Una referencia compartida para horquillas y amortiguadores. Compara
          tecnologias de damping, rangos de recorrido y personalidad de manejo.
        </p>
        <div className="cta-row">
          <button className="primary">Explorar conocimiento</button>
          <button className="ghost">Aportar una entrada</button>
        </div>
        <div className="hero-stats">
          <div>
            <span className="stat">{suspensionCatalog.length}</span>
            <span className="stat-label">Marcas activas</span>
          </div>
          <div>
            <span className="stat">120+</span>
            <span className="stat-label">Modelos documentados</span>
          </div>
          <div>
            <span className="stat">6</span>
            <span className="stat-label">Disciplinas</span>
          </div>
        </div>
      </header>

      <section className="grid">
        {knowledgeBlocks.map((block) => (
          <article key={block.title} className="card">
            <h2>{block.title}</h2>
            <p>{block.detail}</p>
            <span className="meta">Explorar →</span>
          </article>
        ))}
      </section>

      <section className="feature-windows">
        <div className="brand-header">
          <h2>Ventanas de funcionalidad</h2>
          <p>Resumen visual de tipos principales con enfoque y uso recomendado.</p>
        </div>
        <div className="feature-grid">
          {featureWindows.map((item) => (
            <article key={item.title} className="feature-card">
              <div className="feature-image" aria-hidden="true" />
              <div className="feature-body">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="filters">
        <div>
          <h2>Explora por filtros</h2>
          <p>Selecciona disciplina o tipo para reducir la lista.</p>
        </div>
        <div className="filter-group">
          <span className="filter-label">Disciplina</span>
          <div className="filter-row">
            {filterOptions.discipline.map((item) => (
              <button key={item} className="chip">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Tipo</span>
          <div className="filter-row">
            {filterOptions.type.map((item) => (
              <button key={item} className="chip">
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-scout">
        <div className="brand-header">
          <h2>Catalogo por marca</h2>
          <p>Resumen de familias con descripcion en espanol y nombre original.</p>
        </div>
        <div className="brand-grid">
          {suspensionCatalog.map((brand) => (
            <article key={brand.brand} className="brand-card">
              <div className="brand-head">
                <div>
                  <h3>{brand.brand}</h3>
                  <p>Origen: {brand.region}</p>
                </div>
                <span className="pill small">{brand.families.length} familias</span>
              </div>
              <div className="family-list">
                {brand.families.map((family) => (
                  <div key={family.name} className="family-card">
                    <div>
                      <h4>{family.name}</h4>
                      <p>{family.description}</p>
                    </div>
                    <div className="family-meta">
                      <span>{family.type}</span>
                      <span>{family.discipline}</span>
                      <span>{family.travel}</span>
                      <span>{family.damping}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="text-link">Ver cobertura completa</button>
            </article>
          ))}
        </div>
      </section>

      <section className="spec-gallery">
        <div className="brand-header">
          <h2>Especificaciones por modelo</h2>
          <p>Tarjetas individuales para cada modelo registrado, con foto ilustrativa.</p>
        </div>
        <div className="spec-grid">
          {suspensionCatalog.flatMap((brand) =>
            brand.families.map((family) => {
              const imageKey = `${brand.brand}|${family.name}`
              const imageSrc = modelImages[imageKey]
              const modelSlug = makeSlug(`${brand.brand} ${family.name}`)

              return (
                <article key={`${brand.brand}-${family.name}`} className="spec-card">
                  <div
                    className={`spec-image${imageSrc ? ' has-photo' : ''}`}
                    style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}
                    aria-hidden="true"
                  />
                  <div className="spec-body">
                    <div>
                      <p className="spec-brand">{brand.brand}</p>
                      <h3>{family.name}</h3>
                      <p className="spec-copy">{family.description}</p>
                    </div>
                    <div className="spec-meta">
                      <span>{family.type}</span>
                      <span>{family.discipline}</span>
                      <span>{family.travel}</span>
                      <span>{family.damping}</span>
                    </div>
                    <div className="spec-actions">
                      <a className="text-link dark" href={`#/modelo/${modelSlug}`}>
                        Ver ficha completa →
                      </a>
                      <button
                        className="chip"
                        onClick={() => addToCompare({ ...family, brand: brand.brand })}
                      >
                        Añadir a la comparativa
                      </button>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      <section className="cta-panel">
        <div>
          <h2>Construye una referencia clara para cada estilo.</h2>
          <p>Agrega marcas, anos de modelo y rangos de recorrido para comparar rapido.</p>
        </div>
        <button className="primary dark">Crear nueva entrada</button>
      </section>

      <footer className="footer">
        <p>Siguiente: activar filtros por recorrido, damping y diametro de rueda.</p>
      </footer>
    </div>
  )
}
