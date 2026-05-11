import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';





const InicioPage = () => {
    const navigate = useNavigate();
    
    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        
        <div style={{ padding: '0px', minHeight: '100vh' }}>
            <main>
                <p>¡Bienvenido! Este es el punto de inicio para la gestión del taller.</p>

                <h2>Accesos Rápidos (Módulos)</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '20px' }}>
                    {/* Botones basados en el requerimiento del cliente */}
                    <InicioCard 
                        title="Consultar Productos a Reparar" 
                        onClick={() => handleNavigation('/productos-reparar')}
                    />
                    <InicioCard 
                        title="Registrar Recepción de Producto" 
                        onClick={() => handleNavigation('/registrar-recepcion')}
                    />
                    <InicioCard 
                        title="Crear Orden de Reparación" 
                        onClick={() => handleNavigation('/crear-orden')}
                    />
                    <InicioCard 
                        title="Consultar Stock de Repuestos" 
                        onClick={() => handleNavigation('/consultar-stock')}
                    />
                    <InicioCard 
                        title="Consultar Estados de Cuenta" 
                        onClick={() => handleNavigation('/estados-cuenta')}
                    />
                </div>

                
                <h2 style={{ marginTop: '40px' }}>Información Inicio</h2>
                {/* Aquí se implementarán los cuadros de información resumida 
                iría la información resumida (órdenes activas, inventario)*/}
                <p>Pendiente de implementación de cuadros resumen.</p>
            </main>
        </div>
    );
};


const InicioCard = ({ title, path, onClick }) => {
    return (
        <button 
            onClick={onClick} 
            style={{ 
                flexBasis: '30%', // Permite que se vean 3 en línea
                padding: '25px', 
                margin: '10px', 
                borderRadius: '8px', 
                border: 'none',
                backgroundColor: '#ffffff', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '1.1em',
                fontWeight: 'bold',
                transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {title}
        </button>
    );
};

export default InicioPage;