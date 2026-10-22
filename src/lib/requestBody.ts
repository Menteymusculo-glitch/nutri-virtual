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
