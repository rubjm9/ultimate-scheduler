import { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BuilderPage from './pages/BuilderPage';
import PublicViewerPage from './pages/PublicViewerPage';
import ShellLayout from './components/layout/ShellLayout';

const App = () => {
  return (
    <AnimatePresence mode="wait">
      <ShellLayout>
        <Suspense fallback={<div className="p-8">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<BuilderPage />} />
            <Route path="/torneo/:slug" element={<PublicViewerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ShellLayout>
    </AnimatePresence>
  );
};

export default App;
