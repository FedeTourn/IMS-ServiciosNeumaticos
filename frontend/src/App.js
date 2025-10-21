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


// frontend/src/App.js
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

export default App;
