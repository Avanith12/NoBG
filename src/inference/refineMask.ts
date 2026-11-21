export type BrushPoint = { x: number; y: number }
export type BrushMode = 'erase' | 'restore'

/** Paint a segment or dab in place, using image-edge coordinates and pixel centers. */
export function applyBrushStroke(
  mask: Uint8Array,
  width: number,
  height: number,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
  mode: BrushMode,
): void {
  if (radius <= 0 || ![radius, from.x, from.y, to.x, to.y].every(Number.isFinite)) return

  const start = from.y <= to.y ? from : to
  const end = from.y <= to.y ? to : from
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const radiusSquared = radius * radius
  const firstRow = Math.max(0, Math.ceil(start.y - radius - 0.5))
  const lastRow = Math.min(height - 1, Math.floor(end.y + radius - 0.5))
  const target = mode === 'erase' ? 0 : 255

  for (let row = firstRow; row <= lastRow; row++) {
    const y = row + 0.5 - start.y
    // Bound the row by the part of the segment within one radius vertically.
    const firstT = dy === 0 ? 0 : Math.max(0, (y - radius) / dy)
    const lastT = dy === 0 ? 1 : Math.min(1, (y + radius) / dy)
    const firstX = start.x + dx * firstT
    const lastX = start.x + dx * lastT
    const firstColumn = Math.max(0, Math.ceil(Math.min(firstX, lastX) - radius - 0.5))
    const lastColumn = Math.min(width - 1, Math.floor(Math.max(firstX, lastX) + radius - 0.5))

    for (let column = firstColumn; column <= lastColumn; column++) {
      const x = column + 0.5 - start.x
      const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (x * dx + y * dy) / lengthSquared))
      const offsetX = x - t * dx
      const offsetY = y - t * dy
      const distanceSquared = offsetX * offsetX + offsetY * offsetY
      if (distanceSquared >= radiusSquared) continue

      // Keep the inner half fully opaque and ease out to zero at the edge.
      const edge = Math.min(1, 2 * (1 - Math.sqrt(distanceSquared) / radius))
      const strength = edge * edge * (3 - 2 * edge)
      const index = row * width + column
      mask[index] = Math.round(mask[index] + (target - mask[index]) * strength)
    }
  }
}
