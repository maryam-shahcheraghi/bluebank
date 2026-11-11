const value = import.meta.env.VITE_API_URL;
if (!value || !['http:', 'https:'].includes(new URL(value).protocol)) {
  throw new Error('VITE_API_URL must be an absolute HTTP(S) URL.');
}
export const publicApiUrl: string = value;
