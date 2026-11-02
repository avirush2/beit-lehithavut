import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/store.jsx';
import { backend, isDemo } from './lib/backend.js';
import { seedMissing } from './lib/seed.js';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Timing from './pages/Timing.jsx';
import NewDefinition from './pages/NewDefinition.jsx';
import { MyDreamEntry, MyDreamList } from './pages/MyDream.jsx';
import { DreamForm, DreamView, DreamsPage } from './pages/Dreams.jsx';
import { CategoriesPage, CategoryView, IdeaView } from './pages/Categories.jsx';
import Depth from './pages/Depth.jsx';
import Tickle from './pages/Tickle.jsx';
import { ThresholdPage, ThresholdPost } from './pages/Threshold.jsx';
import Admin from './pages/Admin.jsx';
import { Empty } from './components/ui.jsx';
import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="timing" element={<Timing />} />
            <Route path="new" element={<NewDefinition />} />
            <Route path="my-dream" element={<MyDreamList />} />
            <Route path="my-dream/:id" element={<MyDreamEntry />} />
            <Route path="dreams" element={<DreamsPage />} />
            <Route path="dreams/new" element={<DreamForm />} />
            <Route path="dreams/:id" element={<DreamView />} />
            <Route path="dreams/:id/edit" element={<DreamForm />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/:id" element={<CategoryView />} />
            <Route path="ideas/:id" element={<IdeaView />} />
            <Route path="depth" element={<Depth />} />
            <Route path="tickle" element={<Tickle />} />
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
