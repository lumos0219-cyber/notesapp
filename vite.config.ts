import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const DATA_DIR = join(__dirname, 'public', 'data');
const NOTES_DIR = join(DATA_DIR, 'notes');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');
const FOLDERS_PATH = join(DATA_DIR, 'folders.json');

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'publish-api',
      configureServer(server) {
        server.middlewares.use('/api/publish', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('POST only');
            return;
          }
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const plan = JSON.parse(body);
              const { newNotes, modifiedNotes, removedNoteIds, folders } = plan;

              // Ensure directories exist
              if (!existsSync(NOTES_DIR)) mkdirSync(NOTES_DIR, { recursive: true });

              // Write new/modified notes
              const allChanged = [...(newNotes || []), ...(modifiedNotes || [])];
              for (const n of allChanged) {
                writeFileSync(join(NOTES_DIR, `${n.id}.json`), JSON.stringify(n, null, 2));
              }

              // Remove deleted notes
              for (const id of (removedNoteIds || [])) {
                const f = join(NOTES_DIR, `${id}.json`);
                if (existsSync(f)) unlinkSync(f);
              }

              // Update manifest
              let manifest: any = { notes: {}, folders: {} };
              if (existsSync(MANIFEST_PATH)) {
                manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
              }
              for (const n of allChanged) {
                manifest.notes[n.id] = n.updatedAt;
              }
              for (const id of (removedNoteIds || [])) {
                delete manifest.notes[id];
              }
              if (folders) {
                for (const f of folders) {
                  manifest.folders[f.id] = f.createdAt;
                }
              }
              writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

              // Write folders
              if (folders) {
                writeFileSync(FOLDERS_PATH, JSON.stringify(folders, null, 2));
              }

              const total = allChanged.length + (removedNoteIds || []).length;
              console.log(`[publish] ${allChanged.length} notes written, ${(removedNoteIds || []).length} removed`);

              // Auto deploy
              try {
                console.log('[publish] Deploying...');
                execSync('git add public/data', { cwd: __dirname });
                execSync('git commit -m "publish: update notes"', { cwd: __dirname });
                execSync('git push origin main', { cwd: __dirname });
                execSync('npm run deploy', { cwd: __dirname, timeout: 120000 });
                console.log('[publish] Deploy complete');
              } catch (deployErr) {
                console.error('[publish] Deploy error:', deployErr);
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, deployWarning: '文件已生成，但部署失败，请手动运行 npm run deploy' }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, total }));
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
