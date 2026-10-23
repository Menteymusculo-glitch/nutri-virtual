import { describe, it, expect } from 'vitest'
import {
  validateImageFile, fitWithin, isJpeg, stripJpegMetadata,
  PHOTO_FILE_ERRORS, PHOTO_MAX_INPUT_BYTES,
} from '@/lib/photoFile'

// Construye un JPEG mínimo a partir de segmentos [marcador, payload].
function seg(marker: number, payload: number[]): number[] {
  const len = payload.length + 2
  return [0xff, marker, len >> 8, len & 0xff, ...payload]
}
const SOI = [0xff, 0xd8]
const SOS_AND_DATA = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9]
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

describe('validateImageFile', () => {
  it('acepta una imagen de hasta 10 MB', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 2_000_000 })).toBeNull()
    expect(validateImageFile({ type: 'image/heic', size: PHOTO_MAX_INPUT_BYTES })).toBeNull()
  })
  it('rechaza lo que no es imagen', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 1000 })).toBe(PHOTO_FILE_ERRORS.notImage)
    expect(validateImageFile({ type: '', size: 1000 })).toBe(PHOTO_FILE_ERRORS.notImage)
  })
  it('rechaza más de 10 MB antes de comprimir', () => {
    expect(validateImageFile({ type: 'image/png', size: PHOTO_MAX_INPUT_BYTES + 1 })).toBe(PHOTO_FILE_ERRORS.tooBig)
  })
  it('rechaza un archivo vacío', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 0 })).toBe(PHOTO_FILE_ERRORS.unreadable)
  })
})

describe('fitWithin', () => {
  it('reduce el lado mayor a 1.280 manteniendo la proporción', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 960, height: 1280 })
  })
  it('no amplía fotos pequeñas', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
  it('dimensiones inválidas', () => {
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 })
  })
})

describe('stripJpegMetadata', () => {
  it('quita EXIF (con GPS), XMP y comentarios y conserva JFIF, tablas y datos', () => {
    const jfif = seg(0xe0, ascii('JFIF\0'))
    const exif = seg(0xe1, ascii('Exif\0\0GPSLatitude 40.4168'))
    const comment = seg(0xfe, ascii('hecho en casa'))
    const dqt = seg(0xdb, [0x00, 1, 2, 3])
    const input = new Uint8Array([...SOI, ...jfif, ...exif, ...comment, ...dqt, ...SOS_AND_DATA])
    const out = stripJpegMetadata(input)!
    expect(out).not.toBeNull()
    expect(Array.from(out)).toEqual([...SOI, ...jfif, ...dqt, ...SOS_AND_DATA])
    expect(Buffer.from(out).toString('latin1')).not.toContain('GPS')
  })
  it('conserva APP14 (Adobe)', () => {
    const adobe = seg(0xee, ascii('Adobe'))
    const input = new Uint8Array([...SOI, ...adobe, ...SOS_AND_DATA])
    expect(Array.from(stripJpegMetadata(input)!)).toEqual(Array.from(input))
  })
  it('rechaza lo que no es JPEG o está mal formado', () => {
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBe(false)
    expect(stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBeNull()
    // Longitud de segmento que se sale del archivo
    expect(stripJpegMetadata(new Uint8Array([...SOI, 0xff, 0xe1, 0x10, 0x00, 1, 2]))).toBeNull()
    // Basura entre segmentos
    expect(stripJpegMetadata(new Uint8Array([...SOI, 0x00, 0x11, ...SOS_AND_DATA]))).toBeNull()
  })
})
