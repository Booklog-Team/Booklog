import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PointProvider } from './contexts/PointContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <PointProvider>
        <App />
      </PointProvider>
    </AuthProvider>
  </BrowserRouter>
);
