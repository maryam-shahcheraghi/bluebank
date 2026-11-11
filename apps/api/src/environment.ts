import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

export function loadEnvironment() {
  // Package scripts run with apps/api as their working directory.
  if (existsSync('.env')) loadEnvFile('.env');

  const portValue = process.env.PORT ?? '4000';
  if (!/^\d+$/.test(portValue)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const originsValue = process.env.CORS_ORIGINS;
  const origins = originsValue
    ? originsValue.split(',').map((entry) => entry.trim())
    : [];
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(
        'CORS_ORIGINS must contain comma-separated HTTP(S) origins.',
      );
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      origin.includes('*')
    ) {
      throw new Error(
        'CORS_ORIGINS must contain exact HTTP(S) origins without paths, credentials, or wildcards.',
      );
    }
  }

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test.');
  }
  const host = process.env.HOST ?? '127.0.0.1';
  if (!host.trim()) throw new Error('HOST must not be empty.');
  return { port, host, origins };
}
