import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalClientCategory from './ModalClientCategory';

/**
 * Página Principal de Configuración.
 * Organiza los ajustes del sistema por dominios de negocio.
 */
const ConfigurationPage = () => {
    const navigate = useNavigate();
    const [isModalClientCategoryOpen, setIsModalClientCategoryOpen] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Cabecera */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración del Sistema</h1>
                <p className="text-gray-500 text-sm mt-1">Gestione los parámetros globales, usuarios y catálogos maestros del taller.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- SECCIÓN 1: SEGURIDAD Y ACCESO --- */}
                <ConfigSection title="Seguridad y Usuarios" icon="👤">
                    <ConfigButton 
                        label="Consultar Usuarios" 
                        icon="🔍"
                        onClick={() => navigate('/configuracion/usuarios')}
                        variant="info"
                    />
                    <ConfigButton 
                        label="Dar de Alta Usuario" 
                        icon="➕"
                        onClick={() => navigate('/configuracion/alta-usuario')}
                        variant="success"
                    />
                    <ConfigButton 
                        label="Consultar Roles" 
                        icon="🛡️"
                        onClick={() => console.log('Pendiente: Consultar Roles')}
                        variant="pending"
                    />
                    {/* <ConfigButton 
                        label="Agregar Rol" 
                        icon="🔑"
                        onClick={() => navigate('/configuracion/alta-rol')}
                    /> */}
                </ConfigSection>

                {/* --- SECCIÓN 2: CATÁLOGO DE PRODUCTOS (Válvulas) --- */}
                <ConfigSection title="Parámetros de Válvulas" icon="🛠️">
                    <ConfigButton 
                        label="Tipos de Producto" 
                        icon="📋"
                        onClick={() => navigate('/configuracion/tipos')}
                        variant="warning"
                    />
                    <ConfigButton 
                        label="Modelos de Producto" 
                        icon="📐"
                        onClick={() => navigate('/configuracion/modelos')}
                        variant="warning"
                    />
                    <ConfigButton 
                        label="Diccionario de Estados" 
                        icon="🚦"
                        onClick={() => navigate('/configuracion/transiciones')}
                        variant="warning"
                    />
                </ConfigSection>

                {/* --- SECCIÓN 3: CONFIGURACIÓN COMERCIAL --- */}
                <ConfigSection title="Gestión Comercial y Precios" icon="💰">
                    <ConfigButton 
                        label="Listas de Precios por Categoría" 
                        icon="🏷️"
                        onClick={() => navigate('/configuracion/precio-productos')}
                        variant="info"
                    />
                    <ConfigButton 
                        label="Categorías de Cliente" 
                        icon="🏢"
                        onClick={() => setIsModalClientCategoryOpen(true)}
                        variant="info"
                    />{/* 
                    <ConfigButton 
                        label="Gestionar Proveedores" 
                        icon="🚚"
                        onClick={() => console.log('Pendiente: Proveedores')}
                        variant="pending"
                    /> */}
                </ConfigSection>

                {/* --- SECCIÓN 4: AUDITORÍA Y SISTEMA --- */}
                <ConfigSection title="Sistema" icon="💻">
                    <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-xs text-gray-400 italic text-center">
                            Configuraciones avanzadas de logs y copias de seguridad próximamente.
                        </p>
                    </div>
                </ConfigSection>
                {/* Renderizado del Modal */}
                <ModalClientCategory 
                    isOpen={isModalClientCategoryOpen} 
                    onClose={() => setIsModalClientCategoryOpen(false)} 
                />
            </div>
        </div>
    );
};

/**
 * Contenedor para grupos de configuraciones.
 */
const ConfigSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span>{icon}</span> {title}
            </h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children}
        </div>
    </div>
);

/**
 * Botón estilizado para el panel de configuración.
 */
const ConfigButton = ({ label, onClick, icon, variant = 'primary' }) => {
    const variants = {
        primary: 'bg-white text-slate-700 border-gray-200 hover:border-slate-400 hover:bg-slate-50',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
        info: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
        pending: 'bg-gray-50 text-gray-400 border-gray-200 border-dashed hover:bg-white hover:text-gray-600'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 group active:scale-95 ${variants[variant]}`}
        >
            <span className="text-base group-hover:scale-110 transition-transform">{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
};

export default ConfigurationPage;