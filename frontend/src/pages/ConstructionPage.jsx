import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const ConstructionPage = () => {
    const location = useLocation();
    
    // Obtiene el nombre de la ruta para hacerlo más informativo
    const pathname = location.pathname.split('/').pop().replace(/([A-Z])/g, ' $1').trim();

    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '50px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeeba',
            margin: '50px',
            borderRadius: '8px'
        }}>
            <h1 style={{ color: '#856404' }}>🚧 Pantalla en Construcción 🚧</h1>
            <p style={{ fontSize: '1.2em', marginTop: '20px' }}>
                La funcionalidad para **{pathname || 'esta sección'}** aún no ha sido implementada.
            </p>
            <p style={{ color: '#856404' }}>
                Regresa al inicio para continuar trabajando.
            </p>
            <Link to="/Inicio" style={{ 
                marginTop: '30px', 
                display: 'inline-block', 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '5px' 
            }}>
                Volver al Inicio
            </Link>
        </div>
    );
};

export default ConstructionPage;