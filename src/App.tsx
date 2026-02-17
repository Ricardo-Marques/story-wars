import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { Layout } from './components/Layout';
import { PhaseRouter } from './components/PhaseRouter';
import { HomePage } from './pages/HomePage';
import { LobbyPage } from './pages/LobbyPage';
import { SetupPage } from './pages/SetupPage';
import { WritingPage } from './pages/WritingPage';
import { PlayPage } from './pages/PlayPage';
import { ResultsPage } from './pages/ResultsPage';
import { DisconnectOverlay } from './components/DisconnectOverlay';

export function App() {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <PhaseRouter />
      <DisconnectOverlay />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join/:roomCode" element={<HomePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
