import { getPublicApiUrl } from '@/config/public';

export default function HomePage() {
  return (
    <main>
      <h1>Bluebank Web</h1>
      <p>Next.js is running.</p>
      <p>API: {getPublicApiUrl()}</p>
    </main>
  );
}
