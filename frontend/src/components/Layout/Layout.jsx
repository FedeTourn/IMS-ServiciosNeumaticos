import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const { signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const sidebarWidth = isCollapsed ? 70 : 250;

    const mainContentStyle = {
        marginLeft: `${sidebarWidth}px`, // Empuja el contenido principal
        width: `calc(100% - ${sidebarWidth}px)`,
        // padding: '20px',
        transition: 'margin-left 0.3s, width 0.3s',
        minHeight: '100vh',
        backgroundColor: '#f4f4f4',
    };
    
    // Función para manejar el cierre de sesión y la navegación
    const handleSignOut = () => {
        signOut();
        // El PrivateRoute de App.js se encargará de la redirección
    };

    const location = useLocation();
    
    // Obtiene el nombre de la ruta para hacerlo más informativo
    const pathname = location.pathname.split('/').pop().replace(/([A-Z])/g, ' $1').trim().toUpperCase();

    return (
        <div style={{ display: 'flex' }}>
            {/* Componente Sidebar */}
            <Sidebar 
                isCollapsed={isCollapsed} 
                onToggle={() => setIsCollapsed(!isCollapsed)} 
            />

            {/* Contenido Principal */}
            <div style={mainContentStyle}>
                
                <header style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '10px 20px', 
                    marginBottom: '20px',
                    borderBottom: '1px solid #ccc',
                    backgroundColor: 'white'
                }}>
                    <h1 style={{ color: '#000000', margin: 0, fontWeight: 'bold'}}> {pathname} </h1>

                    <button onClick={handleSignOut} style={{ 
                        padding: '8px 15px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}>
                        Cerrar Sesión
                    </button>
                </header>
                
                {/* Contenido de la página (DashboardPage, ConstructionPage, etc.) */}
                <main style={{ padding: '0 20px' }}> {/* Padding horizontal para el contenido de la página */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;