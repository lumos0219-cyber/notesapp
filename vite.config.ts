import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'publish-api',
      configureServer(server) {
        server.middlewares.use('/api/publish', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('POST only');
            return;
          }
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = join(__dirname, 'public', 'published.json');
              writeFileSync(filePath, JSON.stringify(data, null, 2));
              console.log('[publish] Written to public/published.json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              console.error('[publish] Error:', e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        });
      },
    },
  ],
})
