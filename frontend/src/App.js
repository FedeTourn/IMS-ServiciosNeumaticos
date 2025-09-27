import React, { useEffect, useState } from 'react';

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

export default App;
