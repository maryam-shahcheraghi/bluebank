import { publicApiUrl } from '@/config';

export default function App() {
  return (
    <main>
      <h1>Bluebank Admin</h1>
      <p>Vite and React are running.</p>
      <p>API: {publicApiUrl}</p>
    </main>
  );
}
