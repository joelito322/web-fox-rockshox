import { describe, it, expect, vi } from 'vitest'
import { getSlugFromHash } from './routing'

describe('getSlugFromHash', () => {
  it('should return the slug when the hash is valid', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#/modelo/fox-36-factory',
      },
      writable: true,
    })
    expect(getSlugFromHash()).toBe('fox-36-factory')
  })

  it('should return null when the hash is invalid', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#/invalid/hash',
      },
      writable: true,
    })
    expect(getSlugFromHash()).toBeNull()
  })

  it('should return null when there is no hash', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hash: '',
      },
      writable: true,
    })
    expect(getSlugFromHash()).toBeNull()
  })
})
