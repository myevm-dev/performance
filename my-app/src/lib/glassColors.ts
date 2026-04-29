export function getGlassColor(seed: string) {
  let hash = 2166136261

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const hue = Math.abs(hash) % 360

  return `hsl(${hue}, 78%, 56%)`
}

export function getGlassGradient(seed: string) {
  const base = getGlassColor(seed)

  return {
    start: base,
    end: base.replace("56%", "72%"),
  }
}