import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Importa el AuthProvider
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Envuelve la aplicación con el proveedor de autenticación */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

