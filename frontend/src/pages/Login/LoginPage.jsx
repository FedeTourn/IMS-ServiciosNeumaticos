import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { signIn, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Efecto para redirigir si ya está autenticado
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/Inicio', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!username || !password) {
            setError("El usuario y la contraseña son obligatorios.");
            setIsLoading(false);
            return;
        }

        try {
            await signIn(username, password);
            navigate('/Inicio', { replace: true });
        } catch (err) {
            setError(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                {/* Encabezado con branding */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Servicios Neumáticos
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Gestión de Stock y Reparaciones
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Input de Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <input 
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Nombre de usuario"
                        />
                    </div>

                    {/* Input de Contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Botón de Ingreso */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors
                            ${isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Footer del login */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                        UTN FRSF - PFC 2025
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;