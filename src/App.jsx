import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useStore from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trabajos from './pages/Trabajos';
import Ahorros from './pages/Ahorros';
import Sobrantes from './pages/Sobrantes';

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trabajos" element={<Trabajos />} />
          <Route path="/ahorros" element={<Ahorros />} />
          <Route path="/sobrantes" element={<Sobrantes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
