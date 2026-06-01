import React from 'react';
import { useNavigate } from 'react-router-dom';

const InicioPage = () => {
    const navigate = useNavigate();
    
    return (
        <div className="space-y-8 animate-fade-in">

            {/* SECCIÓN 1: Accesos Directos */}
            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ActionCard 
                        title="Consultar Productos" 
                        description="Seguimiento de válvulas en reparación"
                        icon="🔍"
                        onClick={() => navigate('/productos-reparar')} 
                    />
                    <ActionCard 
                        title="Registrar Recepción" 
                        description="Ingreso de nuevos productos al sistema"
                        icon="📥"
                        onClick={() => navigate('/registrar-recepcion')} 
                    />
                    <ActionCard 
                        title="Nueva Orden" 
                        description="Generar orden de trabajo y repuestos"
                        icon="📝"
                        onClick={() => navigate('/crear-orden')} 
                    />
                    <ActionCard 
                        title="Gestionar Clientes" 
                        description="Base de datos y estados de cuenta"
                        icon="👥"
                        onClick={() => navigate('/clientes')} 
                    />
                    <ActionCard 
                        title="Stock de Repuestos" 
                        description="Inventario y alerta de faltantes"
                        icon="🛒"
                        onClick={() => navigate('/consultar-stock')} 
                    />
                    <ActionCard 
                        title="Configuración" 
                        description="Gestión de usuarios y roles"
                        icon="⚙️"
                        onClick={() => navigate('/configuracion')} 
                    />
                </div>
            </div>

            {/* SECCIÓN 2: Métricas de Negocio */}
            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Información Rápida</h2>
                <p className="text-gray-500 mb-4">Bienvenido. Este es el resumen de hoy.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                    <MetricCard title="Válvulas en Taller" value="24" icon="🛠️" color="text-blue-600" bg="bg-blue-50" />
                    <MetricCard title="Pendientes de Entrega" value="12" icon="📦" color="text-yellow-600" bg="bg-yellow-50" />
                    <MetricCard title="Clientes Activos" value="158" icon="👥" color="text-emerald-600" bg="bg-emerald-50" />
                    <MetricCard title="Órdenes del Mes" value="45" icon="📈" color="text-purple-600" bg="bg-purple-50" />
                </div>
            </div>
        </div>
    );
};

/* Componente para las tarjetas de métricas superiores */
const MetricCard = ({ title, value, icon, color, bg }) => (
    <div className={`p-6 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-between`}>
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-xl`}>
            {icon}
        </div>
    </div>
);

/* Componente para los botones de navegación */
const ActionCard = ({ title, description, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-start p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 text-left group"
    >
        <div className="mr-4 text-3xl group-hover:scale-110 transition-transform">{icon}</div>
        <div>
            <h4 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{title}</h4>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
    </button>
);

export default InicioPage;