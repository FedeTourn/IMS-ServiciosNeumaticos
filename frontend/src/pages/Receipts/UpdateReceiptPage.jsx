import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchReceiptById, updateReceiptData} from "../../services/receipt.service";

const UpdateReceiptPage = () => {
    const { id_comprobante } = useParams();
    const navigate = useNavigate();

    // Informacion que cargamos a la pagina (iniciados en vacio)
    const [receiptInfo, setReceiptInfo] = useState({});
    const [products, setProducts] = useState({});
    const [formData, setFormData] = useState({fecha_ingreso:'', observaciones:''});

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Carga inicial de los datos del comprobante
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchReceiptById(id_comprobante);
                const receiptData = response.data;
                setReceiptInfo(receiptData);
                setProducts(receiptData.productos);
                setFormData({
                    fecha_ingreso: receiptData.fecha_recepcion ? receiptData.fecha_recepcion.split('T')[0] : '',
                    observaciones: receiptData.descripcion,
                });
            } catch (error) {
                setIsError(`Error al recuperar el historial: ${error.message}`);
            } finally{
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_comprobante]);

    const handleSaveAndPrint = async (e) => {
        // Validar si hay cambios pendientes compara formData vs receiptInfo
        if((formData.fecha_ingreso === receiptInfo.fecha_recepcion.split('T')[0]) && (formData.observaciones === receiptInfo.descripcion)){
            handlePrint();
            return
        }

        setMessage();
        // Si hay cambios Guardamos
        const success = await handleSubmit(e);

        // Procedemos a la impresión después de 1 segundo
        if (success) {
            setMessage(message.concat(' Los cambios efectuados se guardaron automáticamente para imprimir'));
            setTimeout(() => window.print(), 1000);
        }
    };

    // Guardado de los cambios
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateReceiptData(id_comprobante, {
                fecha_recepcion: formData.fecha_ingreso,
                descripcion: formData.observaciones
            });
            setMessage('✅ Cambios aplicados correctamente.');
            setIsError(false);
            return true;
        } catch (err) {
            setMessage(`❌ Error al actualizar: ${err.message}`);
            setIsError(true);
            return false;
        } finally {
            setIsSaving(false)
        }
    }

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Función auxiliar para formatear fechas legibles (DD/MM/YYYY)
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('es-AR');
    };

    // Impresion
    const handlePrint = () => {
    window.print();
    };

    // Obtener fecha actual
    const dateToday = formatDate(new Date());

    if (isLoading) return <div className="p-10 text-center text-gray-400 animate-pulse">Cargando detalles...</div>;

    return (
        // print:p-0 y print:m-0 remueven los márgenes al momento de imprimir
        <div className="max-w-5xl mx-auto pb-10 px-4 animate-fade-in space-y-6 print:p-0 print:m-0 print:max-w-full">
            
            {/* Contenedor Principal */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
                
                {/* Header Institucional (Se adapta para la impresión) */}
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center print:bg-white print:text-black print:border-b-2 print:border-black print:p-2">
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-tight">Comprobante de Recepción</h1>
                        {/* El número de comprobante es clave para la trazabilidad impresa */}
                        <div className="flex text-s mt-1 uppercase font-mono print:text-gray-600">
                            <p className="text-slate-400">
                                Documento Nro: 
                            </p>
                            <p className="font-bold print:text-gray-800">
                                #REC-{String(receiptInfo.id_comprobante).padStart(5,0)}
                            </p>
                        </div>
                        
                        
                    </div>
                    {/* Fecha de la Impresion o Consulta */}
                    <div className="text-right">
                        <span className="text-sm bg-slate-700 px-3 py-1.5 rounded-md font-mono text-emerald-400 font-bold border border-slate-600 print:border-none print:bg-transparent print:text-black print:p-0">
                            Fecha: {dateToday}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8 print:p-4">
                    
                    {/* SECCIÓN 1: Datos del Comprobante (Editables en web, texto plano en impresión) */}
                    <div className="space-y-4 print:space-y-1">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 print:text-black print:border-black">
                            1. Datos Generales del Remito
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Cliente (Inmutable) */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 print:text-black">
                                    Cliente Solicitante
                                </label>
                                <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm cursor-not-allowed print:border-none print:bg-transparent print:p-0">
                                    {receiptInfo.cliente_nombre + ' (CUIT: '+ receiptInfo.cliente_cuit +')'}
                                </div>
                            </div>

                            {/* Fecha de Ingreso (Editable) */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widste mb-1 print:text-black">
                                    Fecha de Ingreso 
                                    <span className="print:hidden text-emerald-600">* (Editable)</span>
                                </label>
                                <input 
                                    type="date" 
                                    name="fecha_ingreso"
                                    defaultValue={formData.fecha_ingreso}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm print:border-none print:appearance-none print:p-0"
                                />
                            </div>

                            {/* Observaciones (Editable) */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 print:text-black">
                                    Observaciones Generales del Remito <span className="print:hidden text-emerald-600">* (Editable)</span>
                                </label>
                                <textarea 
                                    defaultValue={receiptInfo.descripcion}
                                    name="observaciones"
                                    onChange={handleInputChange}
                                    className="w-full p-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[40px] text-sm print:border-none print:p-0 print:resize-y"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Grilla de Válvulas (Solo Lectura) */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 print:text-black print:border-black">
                            2. Detalle de Válvulas Recibidas
                        </h2>
                        
                        <div className="p-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm print:border-black print:shadow-none">
                            <table className="min-w-full divide-y divide-gray-200 print:divide-black">
                                <thead className="bg-gray-50 font-bold text-gray-600 text-xs uppercase tracking-wider print:bg-gray-200 print:text-black">
                                    <tr>
                                        <th className="px-4 py-3 text-left print:py-2">Ítem</th>
                                        <th className="px-4 py-3 text-left print:py-2">Descripción Válvula</th>
                                        <th className="px-4 py-3 text-left print:py-2">Estado Actual</th>
                                        <th className="px-4 py-3 text-left print:py-2">Observaciones Técnicas</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700 font-medium print:divide-gray-400">
                                    {products.map((product, index) => (
                                        <tr key={product.id_producto}>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400 print:text-black">
                                                {index+1}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 print:text-black">
                                                {product.nombre_tipo + ' ' + product.nombre_modelo}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-100 print:border-none print:bg-transparent print:p-0 print:text-black">
                                                    {product.nombre_estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-left text-gray-500 text-xs italic print:text-black">
                                                {product.observaciones || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botonera General (Oculta al imprimir) */}
                    <div className="print:hidden pt-7 border-t border-gray-100">
                        {message && (
                            <div className={`gap-y-5 mx-8 mb-6 p-2 rounded-xl text-center text-xs font-bold ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {message}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button 
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-100"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={handleSaveAndPrint}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    🖨️ Guardar e Imprimir
                                </button>
                            </div>
                            <button 
                                type="button" onClick={() => navigate('/recepciones')}
                                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 uppercase text-xs tracking-widest"
                            >
                                Volver
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateReceiptPage;