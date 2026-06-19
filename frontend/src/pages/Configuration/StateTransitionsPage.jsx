import React, { useState, useEffect } from 'react';
import * as ProductService from '../../services/product.service';

const StateTransitionsPage = () => {
    const [transitions, setTransitions] = useState([]);

    const [feedback, setFeedback] = useState(null);
    
     
    useEffect(() => {
        const loadTransitions = async () => {
            try {
                const data = await ProductService.fetchStateTransitions();
                setTransitions(data);
            } catch (err) {
                setFeedback({ msg: "Error al cargar transiciones de estado", type: 'error' });
            }
        };
        loadTransitions();
    }, []);

    const groupedTransitions = transitions.reduce((acc, curr) => {
        if (!acc[curr.nombre_origen]) {
            acc[curr.nombre_origen] = [];
        }
        acc[curr.nombre_origen].push(curr.nombre_destino);
        return acc;
    }, {});

    // Paleta semántica para los badges del flujo de válvulas
    const getBadgeStyle = (stateName) => {
        const badges = {
            'RECIBIDO': 'bg-blue-50 text-blue-700 border-blue-200',
            'EN REPARACION': 'bg-amber-50 text-amber-700 border-amber-200',
            'REPARADO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'ENTREGADO': 'bg-slate-100 text-slate-700 border-gray-300',
            'NO REPARABLE': 'bg-red-50 text-red-700 border-red-200',
            'LIBRE': 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return badges[stateName?.toUpperCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    return (
        <div className="p-6">
            <div>
                <p className="text-gray-500 text-sm mt-1">
                    Consulte el mapa de flujos operativos parametrizados para las órdenes del taller.
                </p>
            </div>
            {feedback && (
                <div className={`p-4 mb-4 rounded ${feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {feedback.msg}
                </div>
            )}

            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="py-3 px-6 w-1/3">Estado Actual (Origen)</th>
                            <th className="py-3 px-6">Próximos Estados Permitidos (Destino)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                        {Object.keys(groupedTransitions).length === 0 ? (
                            <tr>
                                <td colSpan="2" className="py-8 text-center text-gray-400 italic">
                                    No se encontraron flujos de estados configurados.
                                </td>
                            </tr>
                        ) : (
                            Object.entries(groupedTransitions).map(([origen, destinos]) => (
                                <tr key={origen} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6 font-semibold align-top">
                                        <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide uppercase ${getBadgeStyle(origen)}`}>
                                            {origen}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 flex flex-wrap gap-2">
                                        {destinos.map((destino, index) => (
                                            <span 
                                                key={`${origen}-${destino}-${index}`} 
                                                className={`px-2.5 py-1 rounded-md border text-xs font-medium uppercase ${getBadgeStyle(destino)}`}
                                            >
                                                {destino}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StateTransitionsPage;