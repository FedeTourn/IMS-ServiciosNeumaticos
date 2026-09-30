import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
    { name: 'Inicio', path: '/Inicio', icon: '🏠' },
    { name: 'Productos a Reparar', path: '/productos-reparar', icon: '🛠️' },
    { name: 'Consultar Recepciones', path: '/recepciones', icon: '📦' },
    { name: 'Crear Orden', path: '/crear-orden', icon: '📝' },
    { name: 'Consultar Stock', path: '/consultar-stock', icon: '🛒' },
    { name: 'Estados de Cuenta', path: '/estados-cuenta', icon: '💰' },
    { name: 'Clientes', path: '/clientes', icon: '👥' },
    { name: 'Configuración', path: '/configuracion', icon: '⚙️' },
];

const Sidebar = ({ isCollapsed, onToggle }) => {
    const { user } = useAuth();
    const location = useLocation();

    return (
        <aside 
            className={`print:hidden bg-slate-800 text-white h-screen sticky top-0 left-0 transition-all duration-300 ease-in-out z-50 flex flex-col
                ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            {/* 1. Header: Altura Fija */}
            <div className="h-16 flex items-center justify-center border-b border-slate-700 shrink-0">
                <span className="text-xl font-bold whitespace-nowrap">
                    {isCollapsed ? 'SN' : 'Servicios Neumáticos'}
                </span>
            </div>
            
            {/* 2. Menú de Navegación: Área con scroll propio si el contenido excede */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex items-center h-11 rounded-lg transition-colors group
                                ${isActive 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <span className={`flex items-center justify-center text-lg shrink-0
                                ${isCollapsed ? 'w-full' : 'w-12'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <span className="ml-1 font-medium truncate">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* 3. Panel de Usuario y Toggle: Siempre al fondo (altura fija) */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50 shrink-0">
                {!isCollapsed && user && (
                    <div className="px-2 mb-4 animate-fade-in">
                        <p className="text-sm font-semibold truncate text-emerald-400">{user.username}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                    </div>
                )}
                <button 
                    onClick={onToggle}
                    className="w-full flex items-center justify-center py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-md active:scale-95 text-white"
                    title={isCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    {isCollapsed ? '▶️' : '◀️'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;