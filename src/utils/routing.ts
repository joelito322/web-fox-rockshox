export const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const getSlugFromHash = () => {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace('#', '')
  if (hash.startsWith('/modelo/')) {
    const slug = hash.replace('/modelo/', '')
    return slug || null
  }
  return null
}
