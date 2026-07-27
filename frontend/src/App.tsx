import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Standorte } from './pages/Standorte';
import { Voelker } from './pages/Voelker';
import { VolkDetail } from './pages/VolkDetail';
import { Arzneimittelbestand } from './pages/Arzneimittelbestand';
import { Benutzer } from './pages/Benutzer';
import { Backup } from './pages/Backup';

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-loading">Lade...</div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-loading">Lade...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/standorte" element={<Standorte />} />
            <Route path="/voelker" element={<Voelker />} />
            <Route path="/voelker/:id" element={<VolkDetail />} />
            <Route path="/arzneimittel" element={<Arzneimittelbestand />} />
            <Route path="/benutzer" element={<Benutzer />} />
            <Route path="/backup" element={<Backup />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
