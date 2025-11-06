import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    // 1. LLAMA AL HOOK useAuth UNA SOLA VEZ AL INICIO
    // Desestructura todas las funciones y valores que necesites.
    const { signIn, signOut, isAuthenticated, user } = useAuth(); // <-- HOOKS EN EL NIVEL SUPERIOR
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (isAuthenticated) {
        // Si el usuario está autenticado
        navigate('/Inicio', { replace: true });
        return null; // No renderiza nada mientras se redirige
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError("Username and password are required.");
            return;
        }

        try {
            // Usa la función signIn desestructurada
            await signIn(username, password);
            // Si tiene éxito, navegar al inicio
            navigate('/Inicio', { replace: true });
        } catch (err) {
            setError(err.message || "Login failed. Check server status.");
        }
    };

    // Formulario de Login
    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc'}}>
            <h2>Inicio de Sesión - Servicios Neumáticos</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Usuario:</label>
                    <input 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Contraseña:</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: 'blue', color: 'white', border: 'none' }}>
                    Ingresar
                </button>
            </form>
        </div>
    );
};

export default LoginPage;