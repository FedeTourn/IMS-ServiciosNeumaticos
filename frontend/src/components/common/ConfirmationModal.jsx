import React from 'react';

/**
 * Componente modal genérico y reutilizable para confirmaciones de acciones críticas.
 * Diseñado con TailwindCSS respetando la consistencia visual del módulo administrativo.
 * * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Flag que controla la visibilidad del modal.
 * @param {function} props.onClose - Función para cancelar y cerrar el modal.
 * @param {function} props.onConfirm - Función que ejecuta la acción tras la aceptación.
 * @param {string} props.title - Título principal del encabezado del modal.
 * @param {string} props.message - Texto descriptivo o advertencia del cuerpo del modal.
 * @param {boolean} [props.isDanger=false] - Define si la acción es destructiva o de alto riesgo, alternando el color de acento.
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
                onClick={onClose}
            />

            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100 max-w-md w-full p-6 relative z-10 transform transition-all scale-100 animate-scale-up">
                
                <div className="flex items-center justify-center h-12 w-12 rounded-full mx-auto mb-4 bg-amber-50 border border-amber-200">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-700 font-medium tracking-wider">
                        {message}
                    </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white shadow-md transition-all active:scale-95
                            ${isDanger 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
                    >
                        Confirmar Acción
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;