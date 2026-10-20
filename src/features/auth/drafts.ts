/** Account-scoped recovery contains no Auth tokens. Clear it only on deliberate exit. */
export function forgetAccountDrafts(userId: string) {
  const prefix = `atlas:draft:${userId}:`;
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}
