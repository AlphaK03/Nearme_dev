import { readFileSync, writeFileSync } from 'node:fs';
import { previewOrigin } from '../backend/src/preview-config.mjs';

try {
  const origin = previewOrigin(process.argv[2]);
  if (!origin) throw new Error('Uso: npm run preview:url -- https://TU-ENLACE.devtunnels.ms');
  const path = new URL('../backend/.env', import.meta.url);
  let contents;
  try { contents = readFileSync(path, 'utf8'); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    contents = readFileSync(new URL('../backend/.env.example', import.meta.url), 'utf8');
  }
  const line = `PUBLIC_APP_URL=${origin}`;
  const updated = /^PUBLIC_APP_URL=.*$/m.test(contents)
    ? contents.replace(/^PUBLIC_APP_URL=.*$/gm, line)
    : `${contents.trimEnd()}\n${line}\n`;
  writeFileSync(path, updated, { mode: 0o600 });
  console.log(`Enlace autorizado: ${origin}\nReinicia el servidor (npm start) para aplicar el cambio.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
