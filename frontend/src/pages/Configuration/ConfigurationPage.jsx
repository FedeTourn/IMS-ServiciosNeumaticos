import React from 'react';
import { useNavigate } from 'react-router-dom';

// Componente para las secciones y botones
const ConfigSection = ({ title, children }) => (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#fff' }}>
        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>{title}</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {children}
        </div>
    </div>
);

// Componente del Botón de Configuración
const ConfigButton = ({ label, onClick, color = '#007bff' }) => (
    <button
        onClick={onClick}
        style={{
            padding: '12px 20px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            fontSize: '1em'
        }}
    >
        {label}
    </button>
);


const ConfigurationPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '20px' }}>
            <h1>⚙️ Configuración del Sistema</h1>
            <p>Panel de administración y ajustes de la aplicación.</p>

            {/* --- SECCIÓN ADMINISTRAR USUARIOS --- */}
            <ConfigSection title="👤 Administrar Usuarios">
                {/* Botón 1: Consulta de Usuarios (que lleva a la tabla) */}
                <ConfigButton 
                    label="Consultar Usuarios" 
                    onClick={() => navigate('/configuracion/usuarios')}
                    color="#17a2b8"
                />
                
                {/* Botón 2: Alta de Usuarios (que usa el endpoint register) */}
                <ConfigButton 
                    label="Dar de Alta Usuario" 
                    onClick={() => navigate('/configuracion/alta-usuario')}
                    color="#28a745"
                />

                {/* Botón 3: Consultar Roles */}
                 <ConfigButton 
                    label="Consultar Roles" 
                    onClick={() => navigate('/configuracion/roles')}
                    color="#007bff"
                />

                {/* Botón 4: Agregar Rol */}
                 <ConfigButton 
                    label="Agregar Rol" 
                    onClick={() => navigate('/configuracion/alta-rol')}
                    color="#007bff"
                />
            </ConfigSection>

            {/* --- SECCIÓN CONFIGURACIÓN DE PRODUCTOS (Botones No Funcionales) --- */}
            <ConfigSection title="🛠️ Administrar Configuración de Productos">
                <ConfigButton label="Gestionar Tipos de Producto" onClick={() => console.log('Pendiente: Gestionar Tipos')} color="#ffc107" />
                <ConfigButton label="Gestionar Modelos de Producto" onClick={() => console.log('Pendiente: Gestionar Modelos')} color="#ffc107" />
                <ConfigButton label="Gestionar Estados de Producto" onClick={() => console.log('Pendiente: Gestionar Estados')} color="#ffc107" />
            </ConfigSection>

            {/* --- SECCIÓN ADMINISTRAR OTROS (Botones No Funcionales) --- */}
            <ConfigSection title="... Administrar Otros">
                <ConfigButton label="Gestionar Proveedores" onClick={() => console.log('Pendiente: Gestionar Proveedores')} color="#6c757d" />
            </ConfigSection>
        </div>
    );
};

export default ConfigurationPage;