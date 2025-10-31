import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Paginas
import InicioPage from './pages/Inicio/InicioPage';
import LoginPage from './pages/Login/LoginPage';
import ConstructionPage from './pages/ConstructionPage';
import Layout from './components/Layout/Layout';

import './App.css';

// Componente que envuelve la lógica para rutas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Puedes usar un spinner o mensaje de carga aquí
    return <div style={{padding: '50px'}}>Cargando autenticación...</div>; 
  }

  // Si no está autenticado, redirige al login
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta pública: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas (se envuelven en PrivateRoute) y usan el layout */}
          <Route 
            path="/*" // Usa un comodín para proteger todas las sub-rutas
            element={
              <PrivateRoute>
                {/* ENVUELVE LAS RUTAS PROTEGIDAS CON EL LAYOUT */}
                <Layout>
                  <Routes>
                    <Route path='/Inicio' element={<InicioPage />}/>
                    
                    {/* --- RUTAS DE CONSTRUCCIÓN --- */}
                    <Route path="/productos-reparar" element={<ConstructionPage />} />
                    <Route path="/registrar-recepcion" element={<ConstructionPage />} />
                    <Route path="/crear-orden" element={<ConstructionPage />} />
                    <Route path="/consultar-stock" element={<ConstructionPage />} />
                    <Route path="/estados-cuenta" element={<ConstructionPage />} />
                    {/* ----------------------------------- */}

                    {/* Manejo de rutas no definidas */}
                    <Route path="*" element={<Navigate to="/Inicio" replace />} />
                  </Routes>
                </Layout>
                
              </PrivateRoute>
            } 
          />
          
          {/* Redirección inicial: Si la URL es la raíz, redirige al Inicio o Login */}
          <Route 
            path="/" 
            element={<Navigate to="/Inicio" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

/* import React, { useEffect, useState } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/ping')
      .then(res => res.json())
      .then(data => setBackendStatus(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-xl">
      <h1 className="text-3xl font-bold mb-4">Frontend funcionando 🚀</h1>
      {backendStatus ? (
        <p className="text-green-600">Backend responde: {JSON.stringify(backendStatus)}</p>
      ) : (
        <p className="text-red-600">Esperando respuesta del backend...</p>
      )}
    </div>
  );
}

export default App; */


/* // frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; 

function App() {
  const [message, setMessage] = useState('Loading...');

  // Función para hacer la llamada al backend
  useEffect(() => {
    fetch('http://localhost:3001/api/test') // Asegúrate que el puerto coincida con el backend
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setMessage(data.message + ' - ' + data.date);
      })
      .catch(error => {
        setMessage('Error connecting to backend: ' + error.message);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Taller App Frontend</h1>
        <p>Backend Status: {message}</p>
        <p>✅ Frontend running on port 3000 (usually)</p>
      </header>
    </div>
  );
}

export default App; */