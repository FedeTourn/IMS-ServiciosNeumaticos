import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, fetchAllRoles, updateUserData } from '../../services/auth.service';

/**
 * Página de actualización de perfiles de usuario.
 * Permite gestionar roles, estados de cuenta y actualización de credenciales.
 */
const UpdateUserPage = () => {
    const { id_user } = useParams();
    const navigate = useNavigate();
    
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        id_role: '',
        is_active: true,
        password: '',
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userData, rolesData] = await Promise.all([
                    fetchUserById(id_user),
                    fetchAllRoles(),
                ]);
                
                setRoles(rolesData);
                setFormData({
                    full_name: userData.full_name || '',
                    username: userData.username || '',
                    id_role: userData.id_role.toString() || '',
                    is_active: userData.is_active,
                    password: '',
                });
            } catch (err) {
                setMessage(`Error al cargar los datos: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsSaving(true);

        const dataToSend = {
            full_name: formData.full_name,
            id_role: parseInt(formData.id_role),
            is_active: formData.is_active,
        };
        
        if (formData.password) dataToSend.password = formData.password;

        try {
            await updateUserData(id_user, dataToSend);
            setMessage('Datos actualizados correctamente.');
            setFormData(prev => ({ ...prev, password: '' })); 
        } catch (err) {
            setMessage(`Error al actualizar: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500 animate-pulse font-medium">Cargando perfil de usuario...</div>;

    return (
        <div className="max-w-2xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Cabecera Informativa */}
                <div className="bg-slate-800 p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-white uppercase tracking-tight">Editar Perfil de Usuario</h1>
                        <p className="text-slate-400 text-xs mt-1 font-mono uppercase">ID de Sistema: {id_user}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${formData.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {formData.is_active ? 'CUENTA ACTIVA' : 'CUENTA SUSPENDIDA'}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    {/* Grupo: Identificación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                            <input 
                                type="text" name="full_name" value={formData.full_name} onChange={handleChange} required 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1 opacity-60">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre de Usuario (Login)</label>
                            <input 
                                type="text" value={formData.username} disabled 
                                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed text-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* Grupo: Atribución de Rol */}
                    <div className="space-y-1 border-t border-gray-50 pt-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nivel de Acceso (Rol)</label>
                        <select 
                            name="id_role" value={formData.id_role} onChange={handleChange} required
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                        >
                            <option value="">Seleccionar nivel...</option>
                            {roles.map(role => (
                                <option key={role.id_role} value={role.id_role}>{role.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Grupo: Seguridad */}
                    <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100 space-y-3">
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Seguridad y Credenciales</h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Actualizar Contraseña</label>
                            <input 
                                type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                                className="w-full p-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
                            />
                            <p className="text-[10px] text-amber-600 italic">Deje este campo vacío si no desea modificar la clave actual.</p>
                        </div>
                    </div>

                    {/* Checkbox de estado */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <input 
                            type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 select-none">Habilitar acceso del usuario al sistema</label>
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 flex flex-col md:flex-row items-center gap-4 border-t border-gray-100">
                        <button 
                            type="submit" disabled={isSaving}
                            className={`w-full md:w-auto px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all
                                ${isSaving ? 'bg-gray-400' : 'bg-slate-800 hover:bg-black active:scale-95 shadow-slate-200'}`}
                        >
                            {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
                        </button>
                        <button 
                            type="button" onClick={() => navigate('/configuracion/usuarios')}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                        >
                            Cancelar
                        </button>

                        {message && (
                            <div className={`flex-1 p-3 rounded-lg text-xs font-bold text-center animate-fade-in ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateUserPage;