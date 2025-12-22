import './index.css'
import fox36Factory from './assets/images/fox-36-factory.webp'
import foxX2 from './assets/images/fox-x2.png'
import fox34StepCast from './assets/images/fox-34-stepcast.png'
import rockshoxBoxxer from './assets/images/RockShox  oxxer.png'
import rockshoxLyrik from './assets/images/RockShox Lyrik Ultimate.png'
import rockshoxSid from './assets/images/RockShox SID Ultimate.png'
import rockshoxSuperDeluxe from './assets/images/RockShox Super Deluxe.png'

type SuspensionFamily = {
  name: string
  type: 'Fork' | 'Shock'
  discipline: string
  travel: string
  damping: string
  description: string
  useCases: string[]
  frame: string
  wheel: string
  axle?: string
  mount?: string
  adjustments: string[]
  notes: string
}

type SuspensionBrand = {
  brand: string
  region: string
  families: SuspensionFamily[]
}

const knowledgeBlocks = [
  {
    title: 'Tipos de suspension',
    detail: 'Aire vs muelle, invertida vs estandar, y como se sienten en ruta.',
  },
  {
    title: 'Sistemas de damping',
    detail: 'HSC/LSC, rebote y palancas de plataforma explicadas por marca.',
  },
  {
    title: 'Recorrido y disciplina',
    detail: 'Rangos de recorrido para XC, trail, enduro y DH con ejemplos.',
  },
]

const suspensionCatalog: SuspensionBrand[] = [
  {
    brand: 'Fox',
    region: 'USA',
    families: [
      {
        name: '36 Factory',
        type: 'Fork',
        discipline: 'Trail',
        travel: '140-160 mm',
        damping: 'GRIP2',
        description: 'Horquilla all-mountain con tacto sensible y soporte en mitad del recorrido.',
        useCases: ['Trail agresivo', 'Enduro ligero', 'Bike park ocasional'],
        frame: 'Cuadros trail o enduro con tubo conico.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['HSC', 'LSC', 'HSR', 'LSR'],
        notes: 'Compatible con offsets 44/51 segun rueda.',
      },
      {
        name: 'Float X2',
        type: 'Shock',
        discipline: 'Enduro',
        travel: 'Long stroke',
        damping: 'VVC',
        description: 'Amortiguador de alto flujo para bajadas largas y ajustes finos.',
        useCases: ['Enduro', 'Descenso tecnico', 'Bike park'],
        frame: 'Cuadros enduro con leverage medio/alto.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet o Trunnion',
        adjustments: ['HSC', 'LSC', 'HSR', 'LSR'],
        notes: 'Requiere espacio para botella y piggyback.',
      },
      {
        name: '34 Step-Cast',
        type: 'Fork',
        discipline: 'XC',
        travel: '100-120 mm',
        damping: 'GRIP SL',
        description: 'Horquilla ligera para XC con rigidez extra en carreras.',
        useCases: ['XC', 'Maraton', 'Downcountry ligero'],
        frame: 'Cuadros XC con tubo conico.',
        wheel: '29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion', 'Rebote'],
        notes: 'Pensada para peso minimo y rigidez frontal.',
      },
      {
        name: 'Float DPS',
        type: 'Shock',
        discipline: 'Trail',
        travel: 'Short stroke',
        damping: 'DPS',
        description: 'Amortiguador compacto para bicicletas trail y downcountry.',
        useCases: ['Trail', 'Downcountry', 'Rutas largas'],
        frame: 'Cuadros trail con anclajes compactos.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet o Trunnion',
        adjustments: ['Compresion 3 posiciones', 'Rebote'],
        notes: 'Ideal cuando el espacio es limitado.',
      },
    ],
  },
  {
    brand: 'RockShox',
    region: 'USA',
    families: [
      {
        name: 'SID Ultimate',
        type: 'Fork',
        discipline: 'XC',
        travel: '100-120 mm',
        damping: 'Charger Race Day',
        description: 'Ligera y rigida para pedaleo rapido y control en maraton.',
        useCases: ['XC', 'Maraton', 'Carrera'],
        frame: 'Cuadros XC con tubo conico.',
        wheel: '29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion remota', 'Rebote'],
        notes: 'Se ofrece con bloqueo remoto para racing.',
      },
      {
        name: 'Super Deluxe',
        type: 'Shock',
        discipline: 'Enduro',
        travel: 'Long stroke',
        damping: 'Charger',
        description: 'Plataforma estable para agresividad, con soporte y traccion.',
        useCases: ['Enduro', 'All-mountain', 'Bike park'],
        frame: 'Cuadros enduro con leverage medio.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet o Trunnion',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Versiones con piggyback para cargas altas.',
      },
      {
        name: 'Lyrik Ultimate',
        type: 'Fork',
        discipline: 'Trail',
        travel: '150-170 mm',
        damping: 'Charger 3',
        description: 'Horquilla para trail agresivo con rigidez y ajuste completo.',
        useCases: ['Trail agresivo', 'Enduro ligero'],
        frame: 'Cuadros trail o enduro ligero.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Charger 3 mejora sensibilidad y soporte.',
      },
      {
        name: 'Boxxer',
        type: 'Fork',
        discipline: 'DH',
        travel: '190-200 mm',
        damping: 'Charger 3',
        description: 'Horquilla de descenso con gran sensibilidad en impactos grandes.',
        useCases: ['DH', 'Bike park', 'Competencia'],
        frame: 'Cuadros DH con tubo conico o directo.',
        wheel: '27.5" o 29"',
        axle: '20x110 Boost DH',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Requiere freno y rueda DH especificos.',
      },
    ],
  },
  {
    brand: 'Ohlins',
    region: 'Sweden',
    families: [
      {
        name: 'RXF38',
        type: 'Fork',
        discipline: 'Enduro',
        travel: '160-180 mm',
        damping: 'TTX',
        description: 'Tacto muy controlado con gran absorcion en altas velocidades.',
        useCases: ['Enduro', 'Bike park', 'Rutas tecnicas'],
        frame: 'Cuadros enduro con tubo conico.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'TTX ofrece estabilidad en tramos largos.',
      },
      {
        name: 'TTX22m',
        type: 'Shock',
        discipline: 'DH',
        travel: 'Coil',
        damping: 'TTX',
        description: 'Amortiguador de muelle para maxima sensibilidad y consistencia.',
        useCases: ['DH', 'Bike park'],
        frame: 'Cuadros DH con anclaje de muelle.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Requiere muelle segun peso y leverage.',
      },
      {
        name: 'TTX Air',
        type: 'Shock',
        discipline: 'Enduro',
        travel: 'Long stroke',
        damping: 'TTX',
        description: 'Version de aire con ajuste preciso para enduro y bike park.',
        useCases: ['Enduro', 'Bike park'],
        frame: 'Cuadros enduro con leverage medio.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet o Trunnion',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Sensacion cercana a muelle con menor peso.',
      },
    ],
  },
  {
    brand: 'Marzocchi',
    region: 'Italy',
    families: [
      {
        name: 'Bomber Z1',
        type: 'Fork',
        discipline: 'Trail',
        travel: '150-170 mm',
        damping: 'Rail',
        description: 'Horquilla robusta para rutas duras con mantenimiento simple.',
        useCases: ['Trail', 'All-mountain', 'Enduro ligero'],
        frame: 'Cuadros trail o enduro.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion', 'Rebote'],
        notes: 'Orientada a durabilidad y tacto consistente.',
      },
      {
        name: 'Bomber CR',
        type: 'Shock',
        discipline: 'Freeride',
        travel: 'Coil',
        damping: 'Coil',
        description: 'Opcion de muelle con tacto lineal y durabilidad.',
        useCases: ['Freeride', 'Bike park'],
        frame: 'Cuadros freeride con anclaje de muelle.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['Rebote'],
        notes: 'Configuracion simple, robusta y facil de mantener.',
      },
      {
        name: 'Bomber Z2',
        type: 'Fork',
        discipline: 'Trail',
        travel: '120-140 mm',
        damping: 'Rail',
        description: 'Horquilla versatil para trail con mantenimiento sencillo.',
        useCases: ['Trail', 'Downcountry'],
        frame: 'Cuadros trail con tubo conico.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion', 'Rebote'],
        notes: 'Buena opcion para upgrades accesibles.',
      },
    ],
  },
  {
    brand: 'DVO',
    region: 'USA',
    families: [
      {
        name: 'Diamond D1',
        type: 'Fork',
        discipline: 'Trail',
        travel: '140-170 mm',
        damping: 'OTT',
        description: 'Horquilla con camara negativa ajustable y tacto personalizable.',
        useCases: ['Trail agresivo', 'Enduro ligero'],
        frame: 'Cuadros trail o enduro.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['OTT', 'Compresion', 'Rebote'],
        notes: 'OTT permite ajustar sensibilidad inicial.',
      },
      {
        name: 'Jade X',
        type: 'Shock',
        discipline: 'DH',
        travel: 'Coil',
        damping: 'Twin-tube',
        description: 'Amortiguador de muelle con sensibilidad inicial destacada.',
        useCases: ['DH', 'Bike park'],
        frame: 'Cuadros DH con leverage alto.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Twin-tube para control constante en calor.',
      },
    ],
  },
  {
    brand: 'Manitou',
    region: 'USA',
    families: [
      {
        name: 'Mezzer Pro',
        type: 'Fork',
        discipline: 'Enduro',
        travel: '160-180 mm',
        damping: 'MC2',
        description: 'Horquilla robusta con barras gruesas y ajuste amplio.',
        useCases: ['Enduro', 'Bike park'],
        frame: 'Cuadros enduro con tubo conico.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion', 'Rebote', 'IRT'],
        notes: 'Barrales de 37 mm para rigidez extra.',
      },
      {
        name: 'Mara Pro',
        type: 'Shock',
        discipline: 'Trail',
        travel: 'Short stroke',
        damping: 'IRT',
        description: 'Amortiguador de aire con ajuste de volumen interno.',
        useCases: ['Trail', 'All-mountain'],
        frame: 'Cuadros trail con leverage progresivo.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['Compresion', 'Rebote'],
        notes: 'IRT permite ajustar soporte a mitad de recorrido.',
      },
    ],
  },
  {
    brand: 'EXT',
    region: 'Italy',
    families: [
      {
        name: 'Era V2',
        type: 'Fork',
        discipline: 'Enduro',
        travel: '160-180 mm',
        damping: 'HS3',
        description: 'Horquilla premium con gran soporte en bajadas tecnicas.',
        useCases: ['Enduro', 'Competencia'],
        frame: 'Cuadros enduro de alto nivel.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Diseño orientado a carreras con baja friccion.',
      },
      {
        name: 'Storia V3',
        type: 'Shock',
        discipline: 'Enduro',
        travel: 'Coil',
        damping: 'HS3',
        description: 'Amortiguador de muelle con gran control de compresion.',
        useCases: ['Enduro', 'Competencia'],
        frame: 'Cuadros enduro con leverage medio.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Se combina con muelles de diferentes tasas.',
      },
    ],
  },
  {
    brand: 'Cane Creek',
    region: 'USA',
    families: [
      {
        name: 'Helm MKII',
        type: 'Fork',
        discipline: 'Trail',
        travel: '120-160 mm',
        damping: 'D-Loc',
        description: 'Horquilla equilibrada con soporte y ajustes sencillos.',
        useCases: ['Trail', 'All-mountain'],
        frame: 'Cuadros trail con tubo conico.',
        wheel: '27.5" o 29"',
        axle: '15x110 Boost',
        adjustments: ['Compresion', 'Rebote', 'D-Loc'],
        notes: 'Bloqueo de 2 posiciones para rutas largas.',
      },
      {
        name: 'DB IL',
        type: 'Shock',
        discipline: 'Trail',
        travel: 'Short stroke',
        damping: 'Double Barrel',
        description: 'Amortiguador compacto con control independiente de compresion.',
        useCases: ['Trail', 'All-mountain'],
        frame: 'Cuadros trail con anclaje compacto.',
        wheel: '27.5" o 29"',
        mount: 'Eyelet',
        adjustments: ['HSC', 'LSC', 'Rebote'],
        notes: 'Control doble para afinacion precisa.',
      },
    ],
  },
]

const filterOptions = {
  discipline: ['Todos', 'XC', 'Trail', 'Enduro', 'DH', 'Freeride'],
  type: ['Todos', 'Fork', 'Shock'],
}

const modelImages: Record<string, string> = {
  'Fox|36 Factory': fox36Factory,
  'Fox|Float X2': foxX2,
  'Fox|34 Step-Cast': fox34StepCast,
  'RockShox|Boxxer': rockshoxBoxxer,
  'RockShox|Lyrik Ultimate': rockshoxLyrik,
  'RockShox|SID Ultimate': rockshoxSid,
  'RockShox|Super Deluxe': rockshoxSuperDeluxe,
}

const featureWindows = [
  {
    title: 'Horquillas de aire',
    copy: 'Ligeras y ajustables. Ideales para XC y trail con soporte progresivo.',
    tags: ['Aire', 'XC', 'Trail'],
  },
  {
    title: 'Horquillas de muelle',
    copy: 'Sensibilidad lineal para enduro y DH, con tacto consistente.',
    tags: ['Muelle', 'Enduro', 'DH'],
  },
  {
    title: 'Amortiguadores de aire',
    copy: 'Versatiles para trail y enduro con rango amplio de ajustes.',
    tags: ['Aire', 'Trail', 'Enduro'],
  },
  {
    title: 'Amortiguadores de muelle',
    copy: 'Maxima traccion y control en descensos largos.',
    tags: ['Muelle', 'DH', 'Freeride'],
  },
]

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const findModelBySlug = (slug: string) => {
  for (const brand of suspensionCatalog) {
    for (const family of brand.families) {
      const familySlug = makeSlug(`${brand.brand} ${family.name}`)
      if (familySlug === slug) {
        return { brand, family, slug: familySlug }
      }
    }
  }
  return null
}

export default function App() {
  const currentHash = window.location.hash.replace('#', '')
  const slug = currentHash.startsWith('/modelo/') ? currentHash.replace('/modelo/', '') : ''
  const selected = slug ? findModelBySlug(slug) : null

  if (selected) {
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

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <p className="eyebrow">Atlas MTB</p>
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
            <span className="meta">Jump in →</span>
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
                    <a className="text-link dark" href={`#/modelo/${modelSlug}`}>
                      Ver ficha completa →
                    </a>
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
          <p>
            Agrega marcas, anos de modelo y rangos de recorrido para comparar rapido.
          </p>
        </div>
        <button className="primary dark">Crear nueva entrada</button>
      </section>

      <footer className="footer">
        <p>Siguiente: activar filtros por recorrido, damping y diametro de rueda.</p>
      </footer>
    </div>
  )
}
