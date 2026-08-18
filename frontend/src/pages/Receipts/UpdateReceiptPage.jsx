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
        <div className="receipt-page  animate-fade-in">

            {/* Contenedor Principal */}
            <div className="receipt-card">

                {/* Header Institucional (Se adapta para la impresión) */}
                <div className="receipt-header">
                    <div>
                        <h1 className="receipt-header-title">Comprobante de Recepción</h1>
                        {/* El número de comprobante es clave para la trazabilidad impresa */}
                        <div className="receipt-header-doc-row">
                            <p className="receipt-header-doc-label">
                                Documento Nro:
                            </p>
                            <p className="receipt-header-doc-value">
                                #REC-{String(receiptInfo.id_comprobante).padStart(5,0)}
                            </p>
                        </div>


                    </div>
                    {/* Fecha de la Impresion o Consulta */}
                    <div className="text-right">
                        <span className="receipt-header-date-badge">
                            Fecha: {dateToday}
                        </span>
                    </div>
                </div>

                <div className="receipt-body">

                    {/* SECCIÓN 1: Datos del Comprobante */}
                    <div className="receipt-section">
                        <h2 className="receipt-section-title">
                            1. Datos Generales del Remito
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <label className="receipt-field-label">
                                    Cliente Solicitante
                                </label>
                                <div className="receipt-static-field">
                                    {receiptInfo.cliente_nombre + ' (CUIT: '+ receiptInfo.cliente_cuit +')'}
                                </div>
                            </div>

                            <div>
                                <label className="receipt-field-label">
                                    Fecha de Ingreso
                                    <span className="receipt-field-label-editable">* (Editable)</span>
                                </label>
                                <input
                                    type="date"
                                    name="fecha_ingreso"
                                    defaultValue={formData.fecha_ingreso}
                                    onChange={handleInputChange}
                                    className="receipt-date-input"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="receipt-field-label">
                                    Observaciones Generales del Remito <span className="receipt-field-label-editable">* (Editable)</span>
                                </label>
                                <textarea
                                    defaultValue={receiptInfo.descripcion}
                                    name="observaciones"
                                    onChange={handleInputChange}
                                    className="receipt-textarea"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Grilla de Válvulas (Solo Lectura) */}
                    <div className="space-y-4">
                        <h2 className="receipt-section-title">
                            2. Detalle de Válvulas Recibidas
                        </h2>

                        <div className="receipt-table-wrapper">
                            <table className="receipt-table">
                                <thead className="receipt-table-head">
                                    <tr>
                                        <th className="receipt-table-th">Ítem</th>
                                        <th className="receipt-table-th">Descripción Válvula</th>
                                        <th className="receipt-table-th">Estado Actual</th>
                                        <th className="receipt-table-th">Observaciones Técnicas</th>
                                    </tr>
                                </thead>
                                <tbody className="receipt-table-body">
                                    {products.map((product, index) => (
                                        <tr key={product.id_producto}>
                                            <td className="receipt-table-index">
                                                {index+1}
                                            </td>
                                            <td className="receipt-table-desc">
                                                {product.nombre_tipo + ' ' + product.nombre_modelo}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="receipt-status-pill">
                                                    {product.nombre_estado}
                                                </span>
                                            </td>
                                            <td className="receipt-table-notes">
                                                {product.observaciones || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botonera General (Oculta al imprimir) */}
                    <div className="receipt-actions">
                        {message && (
                            <div className={`receipt-message ${isError ? 'receipt-message--error' : 'receipt-message--success'}`}>
                                {message}
                            </div>
                        )}
                        <div className="receipt-actions-row">
                            <div className="receipt-actions-left">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="receipt-btn-save"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveAndPrint}
                                    className="receipt-btn-print"
                                >
                                    🖨️ Guardar e Imprimir
                                </button>
                            </div>
                            <button
                                type="button" onClick={() => navigate('/recepciones')}
                                className="receipt-btn-back"
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