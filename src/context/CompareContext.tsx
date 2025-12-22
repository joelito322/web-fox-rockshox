import { createContext, useState, ReactNode } from 'react'
import { SuspensionFamily } from '../data/suspension'

type CompareContextType = {
  compareList: (SuspensionFamily & { brand: string })[]
  addToCompare: (item: SuspensionFamily & { brand: string }) => void
  removeFromCompare: (itemName: string) => void
}

export const CompareContext = createContext<CompareContextType | undefined>(undefined)

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareList, setCompareList] = useState<(SuspensionFamily & { brand: string })[]>([])

  const addToCompare = (item: SuspensionFamily & { brand: string }) => {
    setCompareList((prev) => [...prev, item])
  }

  const removeFromCompare = (itemName: string) => {
    setCompareList((prev) => prev.filter((item) => item.name !== itemName))
  }

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare }}>
      {children}
    </CompareContext.Provider>
  )
}
