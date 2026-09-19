import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import dotenv from 'dotenv';
import { ZodError } from 'zod';
import { AppError, searchSchema, planSchema } from './core.mjs';
import { nearby, geocode } from './places.mjs';
import { createPlan } from './planner.mjs';
import { aiStatus } from './ai.mjs';
import { previewOrigin } from './preview-config.mjs';

dotenv.config({ path: resolve('backend/.env') });
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const origins = new Set((process.env.ALLOWED_ORIGINS || `http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:${port},http://localhost:${port}`).split(','));
const publicOrigin = previewOrigin(process.env.PUBLIC_APP_URL);
if (publicOrigin) origins.add(publicOrigin);
const publicRoot = resolve('web/dist');
const rate = new Map();
let activePlans = 0;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new AppError('Se requiere JSON.', 415);
  const parts = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 16_384) throw new AppError('Solicitud demasiado grande.', 413); parts.push(chunk); }
  try { return JSON.parse(Buffer.concat(parts).toString()); } catch { throw new AppError('JSON inválido.'); }
}
function json(res, value, code = 200) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }

export const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const origin = req.headers.origin;
      if (origin && !origins.has(origin)) throw new AppError('Origen no autorizado.', 403);
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('Solicitud entre sitios no autorizada.', 403);
      const hostName = (req.headers.host || '').split(':')[0];
      const allowedHosts = new Set([...origins].map(o => new URL(o).hostname));
      if (!allowedHosts.has(hostName)) throw new AppError('Host no autorizado.', 403);
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST'); res.writeHead(204); return res.end(); }
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      const counter = rate.get(ip);
      if (!counter || counter.end < now) rate.set(ip, { count: 1, end: now + 60_000 });
      else if (++counter.count > 40) throw new AppError('Demasiadas solicitudes. Espera un minuto.', 429);
      if (req.method === 'GET' && url.pathname === '/api/health') return json(res, { ok: true, ai: aiStatus() });
      if (req.method === 'GET' && url.pathname === '/api/geocode') return json(res, { results: await geocode(url.searchParams.get('q')) });
      if (req.method === 'POST' && url.pathname === '/api/places') return json(res, await nearby(searchSchema.parse(await body(req))));
      if (req.method === 'POST' && url.pathname === '/api/plan') {
        const config = planSchema.parse(await body(req));
        if (activePlans >= 2) throw new AppError('Ya estamos calculando rutas. Intenta en unos segundos.', 429);
        activePlans++;
        try { return json(res, await createPlan(config)); } finally { activePlans--; }
      }
      throw new AppError('No encontrado.', 404);
    }
    if (!['GET', 'HEAD'].includes(req.method)) throw new AppError('Método no permitido.', 405);
    if (decodeURIComponent(url.pathname).split(/[\\/]/).some(part => part.startsWith('.'))) throw new AppError('No encontrado.', 404);
    let file = resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(publicRoot + sep) && file !== publicRoot) throw new AppError('No encontrado.', 404);
    try { if (!(await stat(file)).isFile()) file = resolve(publicRoot, 'index.html'); }
    catch { if (extname(file)) throw new AppError('No encontrado.', 404); file = resolve(publicRoot, 'index.html'); }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (res.headersSent) return res.end();
    json(res, { error: error instanceof ZodError ? 'Revisa la ubicación, las preferencias y los límites del recorrido.' : error instanceof AppError ? error.message : 'No pudimos completar la operación. Intenta de nuevo.' }, error instanceof ZodError ? 400 : error instanceof AppError ? error.status : 503);
  }
});
server.listen(port, host, () => console.log(`NearMe disponible en http://${host}:${port} · IA ${process.env.OPENAI_API_KEY ? 'configurada' : 'opcional'}`));
