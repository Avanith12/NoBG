export function composite(
  original: ImageData,
  mask: Uint8Array,
  background: string | null,
): HTMLCanvasElement {
  const { width, height, data: source } = original
  if (mask.length !== width * height) {
    throw new Error('The mask must contain one value per image pixel.')
  }
  if (background !== null && !/^#[0-9a-f]{6}$/i.test(background)) {
    throw new Error('Enter a background color in #RRGGBB format.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { colorSpace: original.colorSpace })
  if (!context) {
    throw new Error('Could not create a canvas for the image.')
  }

  const result = context.createImageData(width, height, { colorSpace: original.colorSpace })
  const pixels = result.data
  if (background === null) {
    pixels.set(source)
    for (let index = 0; index < mask.length; index++) {
      const alphaOffset = index * 4 + 3
      pixels[alphaOffset] = source[alphaOffset] * mask[index] / 255
    }
  } else {
    // Canvas converts the sRGB HEX color to the source image's color space.
    context.fillStyle = background
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    for (let index = 0; index < mask.length; index++) {
      const offset = index * 4
      const alpha = (source[offset + 3] * mask[index]) / (255 * 255)
      const backgroundAlpha = 1 - alpha
      pixels[offset] = source[offset] * alpha + red * backgroundAlpha
      pixels[offset + 1] = source[offset + 1] * alpha + green * backgroundAlpha
      pixels[offset + 2] = source[offset + 2] * alpha + blue * backgroundAlpha
      pixels[offset + 3] = 255
    }
  }
  context.putImageData(result, 0, 0)
  return canvas
}

export async function exportPng(
  original: ImageData,
  mask: Uint8Array,
  background: string | null,
): Promise<Blob> {
  const canvas = composite(original, mask, background)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Could not encode the image as a PNG.'))
      }
    }, 'image/png')
  })
}
