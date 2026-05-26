import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isLocalhost, fetchPublishedData } from './lib/env'
import { db } from './db'

async function init() {
  if (!isLocalhost()) {
    const data = await fetchPublishedData();
    if (data) {
      await db.folders.clear();
      await db.notes.clear();
      for (const f of data.folders) {
        await db.folders.add({ ...f, published: true });
      }
      for (const n of data.notes) {
        await db.notes.add({ ...n, published: true, attachments: n.attachments || [] });
      }
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

init();
