export function getPublicApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value || !['http:', 'https:'].includes(new URL(value).protocol)) {
    throw new Error('NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL.');
  }
  return value;
}
