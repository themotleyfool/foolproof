import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/navbar';
import { BrowsePage } from './components/pages/browse-page';
import { BuildKnowledgePage } from './components/pages/build-knowledge-page';
import { FindAnswerPage } from './components/pages/find-answer-page';

/**
 * Root application component. Renders the navbar and routes to the active page.
 */
function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-7 px-6">
        <div className="max-w-[860px] mx-auto w-full">
          <Routes>
            <Route index element={<Navigate to="/build" replace />} />
            <Route path="/build"  element={<BuildKnowledgePage />} />
            <Route path="/find"   element={<FindAnswerPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="*"       element={<Navigate to="/build" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
