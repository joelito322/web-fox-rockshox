import { useContext, useState } from 'react'
import { CompareContext } from '../context/CompareContext'
import { suspensionCatalog, SuspensionFamily } from '../data/suspension'
import { modelImages } from '../data/images'
import { makeSlug } from '../utils/routing'

export default function Compare() {
  const compareContext = useContext(CompareContext)
  const [searchTerm, setSearchTerm] = useState('')

  if (!compareContext) {
    return <div>Loading...</div>
  }

  const { compareList, addToCompare, removeFromCompare } = compareContext

  const allModels: (SuspensionFamily & { brand: string })[] = suspensionCatalog.flatMap((brand) =>
    brand.families.map((family) => ({ ...family, brand: brand.brand }))
  )

  const filteredModels = allModels.filter((model) =>
    `${model.brand} ${model.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddModel = (model: SuspensionFamily & { brand: string }) => {
    addToCompare(model)
    setSearchTerm('')
  }

  const getHighlightClass = (
    property: keyof SuspensionFamily,
    currentValue: any,
    models: (SuspensionFamily & { brand: string })[]
  ) => {
    if (models.length < 2) return ''

    const allValues = models.map((model) => model[property])
    const numericValues = allValues.filter((value) => typeof value === 'number') as number[]

    if (numericValues.length !== allValues.length) {
      return new Set(allValues).size > 1 ? 'different' : ''
    }

    let bestValue
    if (property === 'weight') {
      bestValue = Math.min(...numericValues)
    } else {
      bestValue = Math.max(...numericValues)
    }

    if (currentValue === bestValue) return 'best'
    return ''
  }

  const renderSpecValue = (model: SuspensionFamily & { brand: string }, property: keyof SuspensionFamily) => {
    const value = model[property]
    const className = getHighlightClass(property, value, compareList)
    
    let displayValue = value
    if (property === 'price') {
      displayValue = `$${value}`
    } else if (property === 'weight') {
      displayValue = `${value}g`
    } else if (property === 'stanchionDiameter') {
      displayValue = value ? `${value}mm` : 'N/A'
    }

    return <span className={className}>{displayValue}</span>
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>Comparar Suspensiones</h1>
        <p className="lede">
          Selecciona dos o más modelos para comparar sus especificaciones lado a lado.
        </p>
      </header>

      <div className="compare-controls">
        <h2>Añadir Modelos a la Comparativa</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar modelos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="search-results">
              {filteredModels.map((model) => (
                <div
                  key={`${model.brand}-${model.name}`}
                  className="search-result-item"
                  onClick={() => handleAddModel(model)}
                >
                  {model.brand} {model.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {compareList.length > 0 && (
        <div className="compare-grid">
          {compareList.map((model) => {
            const imageKey = `${model.brand}|${model.name}`
            const imageSrc = modelImages[imageKey]
            const modelSlug = makeSlug(`${model.brand} ${model.name}`)

            return (
              <article key={`${model.brand}-${model.name}`} className="spec-card">
                <div
                  className={`spec-image${imageSrc ? ' has-photo' : ''}`}
                  style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}
                  aria-hidden="true"
                />
                <div className="spec-body">
                  <div>
                    <p className="spec-brand">{model.brand}</p>
                    <h3>{model.name}</h3>
                  </div>
                  <div className="compare-specs">
                    <div className="spec-item">
                      <strong>Año:</strong> {renderSpecValue(model, 'year')}
                    </div>
                    <div className="spec-item">
                      <strong>Precio:</strong> {renderSpecValue(model, 'price')}
                    </div>
                    <div className="spec-item">
                      <strong>Peso:</strong> {renderSpecValue(model, 'weight')}
                    </div>
                    <div className="spec-item">
                      <strong>Barras:</strong> {renderSpecValue(model, 'stanchionDiameter')}
                    </div>
                    <div className="spec-item">
                      <strong>Tipo:</strong> {renderSpecValue(model, 'type')}
                    </div>
                    <div className="spec-item">
                      <strong>Disciplina:</strong> {renderSpecValue(model, 'discipline')}
                    </div>
                    <div className="spec-item">
                      <strong>Recorrido:</strong> {renderSpecValue(model, 'travel')}
                    </div>
                    <div className="spec-item">
                      <strong>Damping:</strong> {renderSpecValue(model, 'damping')}
                    </div>
                  </div>
                  <div className="spec-actions">
                    <a className="text-link dark" href={`#/modelo/${modelSlug}`}>
                      Ver ficha completa →
                    </a>
                    <button className="chip" onClick={() => removeFromCompare(model.name)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
