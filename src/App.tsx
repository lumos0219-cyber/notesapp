import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FolderBrowsePage from './pages/FolderBrowsePage';
import AllNotesPage from './pages/AllNotesPage';
import PublishHistoryPage from './pages/PublishHistoryPage';
import NewNotePage from './pages/NewNotePage';
import EditNotePage from './pages/EditNotePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<FolderBrowsePage />} />
          <Route path="all" element={<AllNotesPage />} />
          <Route path="history" element={<PublishHistoryPage />} />
          <Route path="notes/new" element={<NewNotePage />} />
          <Route path="notes/:id/edit" element={<EditNotePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
