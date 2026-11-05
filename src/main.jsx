import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from './lib/store.jsx';
import { backend, isDemo } from './lib/backend.js';
import { seedMissing } from './lib/seed.js';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Observe from './pages/Observe.jsx';
import { HappeningView } from './pages/Happenings.jsx';
import Search from './pages/Search.jsx';
import Library from './pages/Library.jsx';
import Celebrate from './pages/Celebrate.jsx';
import { DreamForm, DreamView, DreamsPage } from './pages/Dreams.jsx';
import { CategoriesPage, CategoryView, IdeaView } from './pages/Categories.jsx';
import { ThresholdPage, ThresholdPost } from './pages/Threshold.jsx';
import Admin from './pages/Admin.jsx';
import { Empty } from './components/ui.jsx';
import './styles.css';

function OldJournalLink() {
  const { id } = useParams();
  return <Navigate to={`/dreams/${id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            {/* העמודים שאוחדו לעמוד אודות ולעמוד החלימה – קישורים ישנים מגיעים לחלק המתאים */}
            <Route path="timing" element={<Navigate to="/about#timing" replace />} />
            <Route path="compass" element={<Navigate to="/about#compass" replace />} />
            <Route path="new" element={<Navigate to="/about#new" replace />} />
            <Route path="vision" element={<Navigate to="/about#vision" replace />} />
            <Route path="tickle" element={<Navigate to="/dreams#tickle" replace />} />
            <Route path="observe" element={<Observe />} />
            <Route path="happenings" element={<Navigate to="/categories" replace />} />
            <Route path="happenings/:id" element={<HappeningView />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="depth" element={<Navigate to="/library" replace />} />
            <Route path="celebrate" element={<Celebrate />} />
            {/* היומן הישן עבר לגן החלומות – קישורים ישנים ממשיכים לעבוד */}
            <Route path="my-dream" element={<Navigate to="/dreams" replace />} />
            <Route path="my-dream/:id" element={<OldJournalLink />} />
            <Route path="dreams" element={<DreamsPage />} />
            <Route path="dreams/new" element={<DreamForm />} />
            <Route path="dreams/:id" element={<DreamView />} />
            <Route path="dreams/:id/edit" element={<DreamForm />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/:id" element={<CategoryView />} />
            <Route path="ideas/:id" element={<IdeaView />} />
            <Route path="threshold" element={<ThresholdPage />} />
            <Route path="threshold/:id" element={<ThresholdPost />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<div className="page"><Empty>הדף הזה עוד לא התהווה.</Empty></div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

async function start() {
  // במצב הדגמה – תוכן הפתיחה נטען מיד, כדי שיהיה מה לראות
  if (isDemo && !(await backend.get('content', 'timingBody'))) await seedMissing();
  ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
}
start();
