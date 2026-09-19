export function previewOrigin(value) {
  if (!value?.trim()) return null;
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('PUBLIC_APP_URL debe ser una dirección HTTPS válida.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_APP_URL debe contener solo el origen HTTPS, sin credenciales, ruta ni parámetros.');
  }
  return url.origin;
}
