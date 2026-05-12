import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout, getCurrentUser } from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    //const [user, setUser] = useState(null);
    //const [isLoading, setIsLoading] = useState(true);

    /* // Carga el usuario al iniciar la aplicación si hay un token guardado
    useEffect(() => {
        const storedUser = getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []); */

    // Inicializamos el estado directamente desde el storage para evitar renders en cascada
    const [user, setUser] = useState(() => {
    const storedUser = getCurrentUser();
    return storedUser || null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // El useEffect queda mucho más limpio o incluso puede removerse si no hay lógica asíncrona
    useEffect(() => {
        // Si necesitas verificar el token contra el servidor, la lógica iría aquí
        // Por ahora, el usuario ya se cargó en la inicialización del state.
    }, []);

    const signIn = async (username, password) => {
        setIsLoading(true);
        try {
            const userData = await login(username, password);
            setUser(userData);
            setIsLoading(false);
            return userData;
        } catch (error) {
            setIsLoading(false);
            throw error; // Propaga el error para que la vista lo maneje
        }
    };

    const signOut = () => {
        logout();
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};