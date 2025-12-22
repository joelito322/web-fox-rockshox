import { makeSlug } from '../utils/routing'

export type SuspensionFamily = {
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

export type SuspensionBrand = {
  brand: string
  region: string
  families: SuspensionFamily[]
}

export const knowledgeBlocks = [
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

export const suspensionCatalog: SuspensionBrand[] = [
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
        notes: 'Diseno orientado a carreras con baja friccion.',
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

export const filterOptions = {
  discipline: ['Todos', 'XC', 'Trail', 'Enduro', 'DH', 'Freeride'],
  type: ['Todos', 'Fork', 'Shock'],
}

export const featureWindows = [
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

export const findModelBySlug = (slug: string) => {
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
