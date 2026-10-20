import { afterEach, describe, it, expect } from 'vitest'
import { getSlugFromHash, makeSlug } from './routing'

afterEach(() => { window.history.replaceState(null, '', '/') })

describe('prototype route compatibility', () => {
  it('reads an existing model link', () => {
    window.history.replaceState(null, '', '/#/modelo/fox-36-factory')
    expect(getSlugFromHash()).toBe('fox-36-factory')
  })

  it.each(['#/invalid/hash', '#/modelo/', ''])('rejects an invalid model link: %s', (hash) => {
    window.history.replaceState(null, '', `/${hash}`)
    expect(getSlugFromHash()).toBeNull()
  })

  it('keeps existing catalog slugs stable', () => {
    expect(makeSlug('RockShox BoXXer Ultimate')).toBe('rockshox-boxxer-ultimate')
  })
})
