import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Define la estructura de tu menú
const menuItems = [
    { name: 'Inicio', path: '/Inicio', icon: '🏠' },
    { name: 'Productos a Reparar', path: '/productos-reparar', icon: '🛠️' },
    { name: 'Registrar Recepción', path: '/registrar-recepcion', icon: '📦' },
    { name: 'Crear Orden', path: '/crear-orden', icon: '📝' },
    { name: 'Consultar Stock', path: '/consultar-stock', icon: '🛒' },
    { name: 'Estados de Cuenta', path: '/estados-cuenta', icon: '💰' },
    // Puedes añadir una sección para Clientes aquí también:
    { name: 'Clientes', path: '/clientes', icon: '👥' },
];

const Sidebar = ({ isCollapsed, onToggle }) => {
    const { user } = useAuth();
    const location = useLocation();

    const baseStyle = {
        width: isCollapsed ? '70px' : '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        transition: 'width 0.3s',
        paddingTop: '20px',
        overflowX: 'hidden',
        zIndex: 1000
    };

    const logoStyle = {
        padding: '10px 0',
        textAlign: 'center',
        fontSize: isCollapsed ? '1.5em' : '2em',
        fontWeight: 'bold',
        marginBottom: '20px',
        borderBottom: '1px solid #34495e'
    };

    return (
        <div style={baseStyle}>
            <div style={logoStyle}>
                {isCollapsed ? 'SN' : 'Servicios Neumáticos'}
            </div>
            
            <div style={{ padding: '0 10px' }}>
                {menuItems.map((item) => (
                    <Link 
                        key={item.path} 
                        to={item.path}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: isCollapsed ? '10px 0' : '10px 15px',
                            margin: '8px 0',
                            textDecoration: 'none',
                            color: location.pathname === item.path ? '#1abc9c' : 'white', // Resalta la página activa
                            backgroundColor: location.pathname === item.path ? '#34495e' : 'transparent',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#34495e'}
                        onMouseOut={e => {
                            if (location.pathname !== item.path) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <span style={{ fontSize: '1.2em', minWidth: '40px', textAlign: 'center' }}>{item.icon}</span>
                        {!isCollapsed && <span style={{ marginLeft: '10px' }}>{item.name}</span>}
                    </Link>
                ))}
            </div>

            <div style={{ 
                position: 'absolute', 
                bottom: '20px', 
                width: '100%', 
                textAlign: 'center',
                padding: '0 10px',
                fontSize: '0.9em'
            }}>
                 {!isCollapsed && (
                    <p style={{ margin: '5px 0' }}>
                        {user.username} ({user.role})
                    </p>
                )}
                <button onClick={onToggle} style={{ 
                    padding: '8px', 
                    width: '50px', 
                    backgroundColor: '#1abc9c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                }}>
                    {isCollapsed ? '▶️' : '◀️'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;