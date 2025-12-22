import { findModelBySlug } from '../data/suspension'
import { modelImages } from '../data/images'
import { makeSlug } from '../utils/routing'

type ModelDetailProps = {
  slug: string
}

export default function ModelDetail({ slug }: ModelDetailProps) {
  const selected = findModelBySlug(slug)

  if (!selected) {
    return (
      <div className="page detail-page">
        <header className="detail-header">
          <a className="text-link dark" href="#/">
            ← Volver al catalogo
          </a>
          <h1>Modelo no encontrado</h1>
          <p className="lede">Revisa el enlace o vuelve al catalogo principal.</p>
        </header>
      </div>
    )
  }

  const imageKey = `${selected.brand.brand}|${selected.family.name}`
  const imageSrc = modelImages[imageKey]
  const related = selected.brand.families.filter((item) => item.name !== selected.family.name)

  return (
    <div className="page detail-page">
      <header className="detail-header">
        <a className="text-link dark" href="#/">
          ← Volver al catalogo
        </a>
        <div>
          <p className="spec-brand">{selected.brand.brand}</p>
          <h1>{selected.family.name}</h1>
          <p className="lede">{selected.family.description}</p>
        </div>
      </header>

      <section className="detail-hero">
        <div
          className={`detail-image${imageSrc ? ' has-photo' : ''}`}
          style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}
          aria-hidden="true"
        />
        <div className="detail-summary">
          <div className="spec-meta">
            <span>{selected.family.type}</span>
            <span>{selected.family.discipline}</span>
            <span>{selected.family.travel}</span>
            <span>{selected.family.damping}</span>
          </div>
          <div className="detail-block">
            <h2>Uso recomendado</h2>
            <ul>
              {selected.family.useCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-block">
            <h2>Compatibilidad</h2>
            <p>{selected.family.frame}</p>
            <div className="detail-tags">
              <span>Rueda: {selected.family.wheel}</span>
              {selected.family.axle ? <span>Eje: {selected.family.axle}</span> : null}
              {selected.family.mount ? <span>Montaje: {selected.family.mount}</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <h3>Ajustes disponibles</h3>
          <ul>
            {selected.family.adjustments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="detail-card">
          <h3>Notas tecnicas</h3>
          <p>{selected.family.notes}</p>
        </article>
        <article className="detail-card">
          <h3>Marca y soporte</h3>
          <p>Origen: {selected.brand.region}</p>
          <p>Consulta manuales para presiones, muelles y servicio.</p>
        </article>
      </section>

      {related.length ? (
        <section className="related">
          <h2>Otros modelos de {selected.brand.brand}</h2>
          <div className="related-grid">
            {related.map((item) => {
              const itemSlug = makeSlug(`${selected.brand.brand} ${item.name}`)
              return (
                <a key={item.name} className="related-card" href={`#/modelo/${itemSlug}`}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="meta">Ver ficha →</span>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
