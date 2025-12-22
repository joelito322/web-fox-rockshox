import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './Home'
import { CompareProvider } from '../context/CompareContext'

describe('Home component', () => {
  it('renders the main heading', () => {
    render(
      <CompareProvider>
        <Home />
      </CompareProvider>
    )
    const heading = screen.getByText(
      /Suspension MTB organizada por marca, recorrido y sensacion./i
    )
    expect(heading).toBeInTheDocument()
  })
})
