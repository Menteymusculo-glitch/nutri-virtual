// Caché en memoria de resultados de búsqueda (dura lo que la pestaña abierta).
// Se limita el tamaño: al pasarse, se descarta la consulta más antigua.

export function searchCacheKey(query: string): string {
  return query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
}

export function createSearchCache<T>(maxEntries = 100) {
  const map = new Map<string, T>()
  return {
    get(query: string): T | undefined {
      const key = searchCacheKey(query)
      const hit = map.get(key)
      if (hit !== undefined) {
        // Refrescar su posición: la más usada queda al final.
        map.delete(key)
        map.set(key, hit)
      }
      return hit
    },
    set(query: string, value: T): void {
      const key = searchCacheKey(query)
      map.delete(key)
      map.set(key, value)
      while (map.size > maxEntries) map.delete(map.keys().next().value as string)
    },
    get size() { return map.size },
  }
}
