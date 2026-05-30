import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Componente de estructura principal del sistema.
 * Gestiona la disposición del Sidebar y el contenido dinámico.
 */
const Layout = ({ children }) => {
    const { signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Lógica para formatear el título de la página basado en la URL
    const pageTitle = location.pathname === '/Inicio' 
        ? 'PANEL DE INICIO' 
        : location.pathname.split('/').pop().replace(/(-)/g, ' ').replace(/([A-Z])/g, ' $1').trim().toUpperCase();

    const handleSignOut = () => {
        signOut();
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Componente Sidebar */}
            <Sidebar 
                isCollapsed={isCollapsed} 
                onToggle={() => setIsCollapsed(!isCollapsed)} 
            />

            {/* Contenedor de Contenido Principal */}
            <div className="flex-1 flex flex-col transition-all duration-300">
                
                {/* Header Global */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                        {pageTitle}
                    </h1>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleSignOut}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold border border-red-100 hover:bg-red-600 hover:text-white transition-colors duration-200"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </header>
                
                {/* Área de Visualización de Páginas */}
                <main className="p-6 overflow-y-auto">
                    {/* Contenedor interno para limitar el ancho máximo en pantallas ultra-wide si se desea */}
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Footer simple opcional */}
                <footer className="mt-auto py-4 px-6 text-center text-xs text-gray-400">
                    © 2025 Servicios Neumáticos - Sistema de Gestión Interna
                </footer>
            </div>
        </div>
    );
};

export default Layout;