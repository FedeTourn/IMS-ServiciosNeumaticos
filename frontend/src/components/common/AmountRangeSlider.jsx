import React from 'react';

/**
 * Presenta un importe con separadores de miles en formato local.
 * @param {number} importe - Valor numérico a formatear.
 * @returns {string} Importe legible (ej. 1.250).
 */
const formatAmount = (importe) => Number(importe).toLocaleString('es-AR');

/**
 * Control único de selección de rango de importes, compuesto por dos deslizadores
 * superpuestos sobre una misma barra y dos campos numéricos sincronizados.
 * Es un componente controlado: no conserva estado propio, informa cada cambio al contenedor.
 * @param {Object} props - Propiedades del componente.
 * @param {number} props.min - Límite inferior absoluto del rango disponible.
 * @param {number} props.max - Límite superior absoluto del rango disponible (tope derivado de los datos).
 * @param {number} props.step - Granularidad del desplazamiento de los deslizadores.
 * @param {number} props.valueMin - Importe mínimo actualmente seleccionado.
 * @param {number} props.valueMax - Importe máximo actualmente seleccionado.
 * @param {Function} props.onChange - Notifica el nuevo par (min, max) al contenedor.
 * @param {boolean} [props.disabled=false] - Inhabilita el control mientras no haya tope calculado.
 * @returns {JSX.Element} Control de rango de importes.
 */
const AmountRangeSlider = ({ min, max, step, valueMin, valueMax, onChange, disabled = false }) => {

    // Ante un tope aún no calculado se evita la división por cero del cálculo de porcentajes
    const recorrido = max > min ? max - min : 1;
    const porcentajeInicio = ((valueMin - min) / recorrido) * 100;
    const porcentajeFin = ((valueMax - min) / recorrido) * 100;

    /**
     * Procesa el desplazamiento del deslizador inferior, impidiendo que supere al superior.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleMinChange = (e) => {
        const nuevoMin = Math.min(Number(e.target.value), valueMax);
        onChange(nuevoMin, valueMax);
    };

    /**
     * Procesa el desplazamiento del deslizador superior, impidiendo que descienda por debajo del inferior.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleMaxChange = (e) => {
        const nuevoMax = Math.max(Number(e.target.value), valueMin);
        onChange(valueMin, nuevoMax);
    };

    /**
     * Procesa la edición manual del importe mínimo, acotándolo al rango disponible.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleMinInput = (e) => {
        const ingresado = Number(e.target.value);
        if (Number.isNaN(ingresado)) return;
        onChange(Math.min(Math.max(ingresado, min), valueMax), valueMax);
    };

    /**
     * Procesa la edición manual del importe máximo, acotándolo al rango disponible.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleMaxInput = (e) => {
        const ingresado = Number(e.target.value);
        if (Number.isNaN(ingresado)) return;
        onChange(valueMin, Math.max(Math.min(ingresado, max), valueMin));
    };

    // Clases compartidas por ambos deslizadores: la pista se oculta para dejar visible la barra
    // propia del componente, y sólo los pulgares reciben eventos del puntero, de modo que ambos
    // controles puedan operarse pese a estar superpuestos.
    const sliderClasses = `
        absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-600
        [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer
        [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
        [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-600
        [&::-moz-range-thumb]:cursor-pointer
        disabled:[&::-webkit-slider-thumb]:border-gray-300
        disabled:[&::-moz-range-thumb]:border-gray-300
    `;

    return (
        <div className={`border border-gray-300 rounded-lg p-3 bg-gray-50 ${disabled ? 'opacity-60' : ''}`}>

            {/* Barra de rango con ambos deslizadores superpuestos */}
            <div className="relative h-4 flex items-center">
                <div className="absolute w-full h-1.5 rounded-full bg-gray-200"></div>
                <div
                    className="absolute h-1.5 rounded-full bg-emerald-500"
                    style={{ left: `${porcentajeInicio}%`, width: `${porcentajeFin - porcentajeInicio}%` }}
                ></div>

                <input
                    type="range"
                    aria-label="Importe mínimo"
                    min={min}
                    max={max}
                    step={step}
                    value={valueMin}
                    onChange={handleMinChange}
                    disabled={disabled}
                    className={sliderClasses}
                />
                <input
                    type="range"
                    aria-label="Importe máximo"
                    min={min}
                    max={max}
                    step={step}
                    value={valueMax}
                    onChange={handleMaxChange}
                    disabled={disabled}
                    className={sliderClasses}
                />
            </div>

            {/* Campos numéricos sincronizados con los deslizadores */}
            <div className="flex items-center gap-2 mt-3">
                <input
                    type="number"
                    aria-label="Importe mínimo exacto"
                    min={min}
                    max={max}
                    step={step}
                    value={valueMin}
                    onChange={handleMinInput}
                    disabled={disabled}
                    className="w-full border border-gray-300 rounded-md p-1.5 bg-white text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-xs font-bold">—</span>
                <input
                    type="number"
                    aria-label="Importe máximo exacto"
                    min={min}
                    max={max}
                    step={step}
                    value={valueMax}
                    onChange={handleMaxInput}
                    disabled={disabled}
                    className="w-full border border-gray-300 rounded-md p-1.5 bg-white text-xs font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                <span>${formatAmount(min)}</span>
                <span>${formatAmount(max)}</span>
            </div>
        </div>
    );
};

export default AmountRangeSlider;
