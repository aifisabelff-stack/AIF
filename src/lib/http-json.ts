/** Lee JSON del body de una petición sin lanzar si viene vacío o mal formado */
export async function readRequestJson<T>(request: Request): Promise<T | null> {
  const text = await request.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/** Lee JSON de una respuesta fetch sin lanzar si viene vacío o mal formado */
export async function readResponseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}
