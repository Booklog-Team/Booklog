import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PointProvider } from './contexts/PointContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      {/* PointProvider는 AuthProvider 안에 위치 — useAuth() 의존 */}
      <PointProvider>
        <App />
      </PointProvider>
    </AuthProvider>
  </BrowserRouter>
);
