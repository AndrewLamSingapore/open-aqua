import { copyFile, readFile, writeFile } from 'node:fs/promises';

const indexPath = new URL('../dist/index.html', import.meta.url);
const iconPath = new URL('../dist/icon.png', import.meta.url);
const manifestPath = new URL('../dist/manifest.webmanifest', import.meta.url);

await copyFile(new URL('../assets/icon.png', import.meta.url), iconPath);
await writeFile(manifestPath, JSON.stringify({
  name: 'Open Aqua',
  short_name: 'Open Aqua',
  description: 'A calm, private operating system for aquarium care.',
  start_url: '/',
  display: 'standalone',
  background_color: '#F4F8F8',
  theme_color: '#0B2748',
  icons: [{ src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' }]
}, null, 2));

const index = await readFile(indexPath, 'utf8');
const installMetadata = `
    <meta name="theme-color" content="#0B2748" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Open Aqua" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />`;
await writeFile(indexPath, index.replace('    <title>Open Aqua</title>', `    <title>Open Aqua</title>${installMetadata}`));
