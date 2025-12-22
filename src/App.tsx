import { useEffect, useState } from 'react'
import './index.css'
import { getSlugFromHash } from './utils/routing'
import Home from './pages/Home'
import ModelDetail from './pages/ModelDetail'
import Compare from './pages/Compare'
import { CompareProvider } from './context/CompareContext'

export default function App() {
  const [slug, setSlug] = useState<string | null>(getSlugFromHash())
  const [page, setPage] = useState<string>('home')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith('#/modelo/')) {
        setPage('model')
        setSlug(getSlugFromHash())
      } else if (hash === '#/compare') {
        setPage('compare')
        setSlug(null)
      } else {
        setPage('home')
        setSlug(null)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'model':
        return slug ? <ModelDetail slug={slug} /> : <Home />
      case 'compare':
        return <Compare />
      default:
        return <Home />
    }
  }

  return (
    <CompareProvider>
      <div>
        <nav className="main-nav">
          <a href="#/">Home</a>
          <a href="#/compare">Compare</a>
        </nav>
        {renderPage()}
      </div>
    </CompareProvider>
  )
}
