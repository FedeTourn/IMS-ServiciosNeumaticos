import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers } from '../../services/auth.service';

/**
 * Vista de administración de usuarios.
 * Proporciona una tabla de consulta con el estado de las cuentas y roles.
 */
const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await fetchAllUsers();
                setUsers(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- CABECERA Y ACCIONES --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500">Control de acceso y perfiles del personal del taller.</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/configuracion')}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Volver
                    </button>
                    <button 
                        onClick={() => navigate('/configuracion/alta-usuario')} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 text-sm"
                    >
                        <span>+</span> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* --- CONTENEDOR DE TABLA --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-400 animate-pulse font-medium">Consultando registros de seguridad...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-600 bg-red-50 font-medium">Error de conexión: {error}</div>
                ) : users.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 italic">No hay usuarios registrados en el sistema.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-20">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credencial</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Nivel de Acceso</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id_user} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-400 text-center">#{user.id_user}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-800">{user.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded inline-block">
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase rounded-full border border-blue-100">
                                                {user.role_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => navigate(`/configuracion/modificar-usuario/${user.id_user}`)}
                                                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-white hover:bg-slate-800 border border-slate-200 rounded-lg transition-all"
                                            >
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserListPage;