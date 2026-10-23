// Lee y parsea un cuerpo JSON con límite de tamaño. Nunca acepta JSON ilimitado.
export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string }

export async function readJsonLimited(req: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declared = Number(req.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: 'Los datos enviados son demasiado grandes.' }
  }
  let text: string
  try {
    text = await req.text()
  } catch {
    return { ok: false, status: 400, error: 'No se pudo leer la petición.' }
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, status: 413, error: 'Los datos enviados son demasiado grandes.' }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400, error: 'JSON inválido.' }
  }
}

export type BytesBodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 400 | 413; error: string }

// Igual que readJsonLimited pero para un cuerpo binario (p. ej. una foto JPEG).
export async function readBytesLimited(req: Request, maxBytes: number): Promise<BytesBodyResult> {
  const declared = Number(req.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: 'Los datos enviados son demasiado grandes.' }
  }
  let buf: ArrayBuffer
  try {
    buf = await req.arrayBuffer()
  } catch {
    return { ok: false, status: 400, error: 'No se pudo leer la petición.' }
  }
  if (buf.byteLength > maxBytes) return { ok: false, status: 413, error: 'Los datos enviados son demasiado grandes.' }
  if (buf.byteLength === 0) return { ok: false, status: 400, error: 'No llegó ninguna foto.' }
  return { ok: true, bytes: new Uint8Array(buf) }
}
