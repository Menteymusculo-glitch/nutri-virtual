// Validación y limpieza de la foto del plato (pura, sin red).
// En el navegador: se valida el archivo y se comprime a JPEG de 1.280 px como
// máximo (al redibujarla en un canvas se pierden los metadatos EXIF, incluida la
// ubicación). En el servidor: se comprueba que es un JPEG y se quitan los
// segmentos de metadatos que pudieran quedar.

export const PHOTO_MAX_INPUT_BYTES = 10 * 1024 * 1024 // antes de comprimir
export const PHOTO_MAX_UPLOAD_BYTES = 3 * 1024 * 1024 // lo que acepta el servidor
export const PHOTO_MAX_SIDE = 1280
export const PHOTO_JPEG_QUALITY = 0.8

export const PHOTO_FILE_ERRORS = {
  notImage: 'Ese archivo no es una imagen. Elige una foto de tu plato.',
  tooBig: 'La foto pesa más de 10 MB. Prueba con otra o hazla de nuevo con la cámara.',
  unreadable: 'No pude abrir esa foto. Prueba con otra o hazla de nuevo con la cámara.',
} as const

// Antes de comprimir. null = se puede usar.
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!file.type || !file.type.startsWith('image/')) return PHOTO_FILE_ERRORS.notImage
  if (file.size > PHOTO_MAX_INPUT_BYTES) return PHOTO_FILE_ERRORS.tooBig
  if (file.size <= 0) return PHOTO_FILE_ERRORS.unreadable
  return null
}

// Tamaño final manteniendo la proporción; nunca se amplía una foto pequeña.
export function fitWithin(width: number, height: number, maxSide = PHOTO_MAX_SIDE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

// Quita del JPEG los segmentos de metadatos (APP1 = EXIF/XMP con la ubicación,
// APP2…APP13, APP15 y comentarios). Conserva APP0 (JFIF) y APP14 (Adobe, afecta al
// color) y todo lo necesario para decodificar. Devuelve null si el JPEG está mal formado.
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  if (!isJpeg(bytes)) return null
  const out: Uint8Array[] = [bytes.subarray(0, 2)]
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) return null
    // Bytes de relleno 0xFF entre segmentos.
    while (i < bytes.length && bytes[i] === 0xff && bytes[i + 1] === 0xff) i++
    const marker = bytes[i + 1]
    if (marker === undefined) return null
    if (marker === 0xda) {
      // Inicio de la imagen comprimida: a partir de aquí se copia tal cual.
      out.push(bytes.subarray(i))
      break
    }
    if (marker === 0xd9) { out.push(bytes.subarray(i, i + 2)); break }
    if (i + 3 >= bytes.length) return null
    const len = (bytes[i + 2] << 8) | bytes[i + 3]
    if (len < 2 || i + 2 + len > bytes.length) return null
    const isMetadata = (marker >= 0xe1 && marker <= 0xed) || marker === 0xef || marker === 0xfe
    if (!isMetadata) out.push(bytes.subarray(i, i + 2 + len))
    i += 2 + len
  }
  const total = out.reduce((n, b) => n + b.length, 0)
  const result = new Uint8Array(total)
  let o = 0
  for (const b of out) { result.set(b, o); o += b.length }
  return result
}

// Solo en el navegador: abre la foto (respetando la orientación de la cámara),
// la reduce y la vuelve a codificar como JPEG sin metadatos.
export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY))
    if (!blob) throw new Error('toBlob')
    return blob
  } finally {
    bitmap.close()
  }
}
