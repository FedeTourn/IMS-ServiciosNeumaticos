import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRoles, register } from '../../services/auth.service';

/**
 * Componente de formulario para el registro de nuevos usuarios en el sistema.
 * Implementa validaciones en el lado del cliente y manejo de foco adaptativo.
 */
const CreateUserPage = () => {
    const navigate = useNavigate();
    
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        id_role: '',
        password: '',
        password_confirm: '',
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Referencias para control de foco en validaciones
    const passwordRef = useRef(null);
    const passwordConfirmRef = useRef(null);

    useEffect(() => {
        const loadRoles = async () => {
            try {
                const rolesData = await fetchAllRoles();
                setRoles(rolesData);
            } catch (err) {
                setMessage(`Error al cargar los roles del sistema: ${err.message}`);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadRoles();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        // Validaciones de seguridad en Frontend
        if (formData.password.length < 8) {
             setMessage('La contraseña debe contener una longitud mínima de 8 caracteres.');
             setIsError(true);
             passwordRef.current?.focus();
             return;
        }

        if (formData.password !== formData.password_confirm) {
            setMessage('Error de consistencia: las contraseñas ingresadas no coinciden.');
            setIsError(true);
            passwordConfirmRef.current?.focus();
            return;
        }

        setIsSaving(true);
        
        const dataToSend = {
            full_name: formData.full_name,
            username: formData.username,
            id_role: parseInt(formData.id_role),
            password: formData.password,
        };

        try {
            await register(dataToSend);
            setMessage('Usuario registrado exitosamente en la plataforma.');
            setIsError(false);
            
            setTimeout(() => {
                 navigate('/configuracion/usuarios'); 
            }, 1500);
            
        } catch (err) {
            setMessage(`Error al registrar el usuario: ${err.message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center animate-pulse text-gray-500 font-medium">Cargando formulario de seguridad...</div>;
    }
    
    return (
        <div className="max-w-2xl mx-auto pb-10 animate-fade-in">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                
                {/* Encabezado del Formulario */}
                <div className="bg-slate-800 p-6">
                    <h1 className="text-xl font-bold text-white uppercase tracking-tight">Dar de Alta Nuevo Usuario</h1>
                    <p className="text-slate-400 text-xs mt-1">Registre al nuevo personal asignándole un rol operacional y credenciales de acceso iniciales.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    
                    {/* SECCIÓN 1: DATOS DE IDENTIFICACIÓN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">01.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Identificación y Atribución</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <Field 
                                label="Nombre Completo *" 
                                name="full_name" 
                                value={formData.full_name} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ej: Juan Pérez"
                            />
                            
                            <Field 
                                label="Nombre de Usuario (Login) *" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ej: jperez"
                            />

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Rol Asignado *</label>
                                <select 
                                    id="id_role" 
                                    name="id_role" 
                                    value={formData.id_role} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700"
                                >
                                    <option value="">Seleccione un Rol de la lista...</option>
                                    {roles.map(role => (
                                        <option key={role.id_role} value={role.id_role}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: SEGURIDAD Y CREDENCIALES */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-emerald-500 font-bold">02.</span>
                            <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Credenciales de Seguridad</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-gray-100">
                            <Field 
                                label="Contraseña *" 
                                name="password" 
                                type="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                                inputRef={passwordRef}
                                placeholder="Mínimo 8 caracteres"
                            />
                            
                            <Field 
                                label="Confirmar Contraseña *" 
                                name="password_confirm" 
                                type="password" 
                                value={formData.password_confirm} 
                                onChange={handleChange} 
                                required 
                                inputRef={passwordConfirmRef}
                                placeholder="Repita la contraseña"
                            />
                        </div>
                    </div>
                    
                    {/* BOTONERA DE CONTROL Y MENSAJES */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center gap-4">
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className={`w-full md:w-auto px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all
                                ${isSaving 
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200'}`}
                        >
                            {isSaving ? 'Registrando...' : 'Crear Usuario'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => navigate('/configuracion/usuarios')} 
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>

                        {message && (
                            <div className={`flex-1 p-3 rounded-xl text-xs font-bold text-center animate-fade-in 
                                ${isError 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : 'bg-emerald-50 text-emerald-700 border border-green-100'}`}
                            >
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Componente atómico reutilizable para campos de texto/contraseña del formulario.
 */
const Field = ({ label, name, value, onChange, required = false, type = "text", inputRef, placeholder }) => (
    <div className="space-y-1">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
        <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            ref={inputRef}
            placeholder={placeholder}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium"
        />
    </div>
);

export default CreateUserPage;