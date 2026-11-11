import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const appOutput = new URL('../.next/standalone/apps/web/', import.meta.url);
await mkdir(new URL('.next/', appOutput), { recursive: true });
await cp(
  new URL('../.next/static/', import.meta.url),
  new URL('.next/static/', appOutput),
  { recursive: true },
);
const publicDirectory = new URL('../public/', import.meta.url);
if (existsSync(publicDirectory)) {
  await cp(publicDirectory, new URL('public/', appOutput), { recursive: true });
}
