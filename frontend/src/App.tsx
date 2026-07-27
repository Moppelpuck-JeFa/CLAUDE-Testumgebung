import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Standorte } from './pages/Standorte';
import { Voelker } from './pages/Voelker';
import { VolkDetail } from './pages/VolkDetail';
import { Arzneimittelbestand } from './pages/Arzneimittelbestand';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/standorte" element={<Standorte />} />
          <Route path="/voelker" element={<Voelker />} />
          <Route path="/voelker/:id" element={<VolkDetail />} />
          <Route path="/arzneimittel" element={<Arzneimittelbestand />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
