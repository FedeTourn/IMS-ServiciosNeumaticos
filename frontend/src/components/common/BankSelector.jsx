import React, { useState } from 'react';
import { apiCreateBank } from '../../services/payment.service';

/**
 * Normaliza un texto para las comparaciones de búsqueda: recorta espacios, pasa a minúsculas
 * y suprime los acentos, de modo que la coincidencia no dependa de la caja ni de la acentuación.
 * @param {string} texto - Texto a normalizar.
 * @returns {string} Texto normalizado.
 */
const normalizeText = (texto) => String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Modal de alta asistida de un banco. Lista los bancos de nombre semejante al ingresado y exige
 * una confirmación explícita antes de crear uno nuevo cuando existen, ofreciendo seleccionarlos
 * en su lugar para evitar duplicados en el catálogo.
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.initialName - Nombre con el que se precarga el campo (texto de búsqueda vigente).
 * @param {Array<Object>} props.banks - Catálogo de bancos en memoria.
 * @param {Function} props.onClose - Cierra el modal sin cambios.
 * @param {Function} props.onCreated - Notifica el banco recién creado.
 * @param {Function} props.onSelectExisting - Notifica la elección de un banco ya existente.
 * @returns {JSX.Element} Modal de alta de banco.
 */
const BankCreateModal = ({ initialName, banks, onClose, onCreated, onSelectExisting }) => {
    const [nombre, setNombre] = useState(initialName);
    const [confirmado, setConfirmado] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const buscado = normalizeText(nombre);
    const similares = buscado
        ? banks.filter((bank) => {
            const existente = normalizeText(bank.nombre);
            return existente.includes(buscado) || buscado.includes(existente);
        })
        : [];
    const puedeCrear = !isCreating && buscado !== '' && (similares.length === 0 || confirmado);

    /**
     * Actualiza el nombre ingresado y revoca la confirmación previa, dado que los bancos semejantes cambian.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleNombreChange = (e) => {
        setNombre(e.target.value);
        setConfirmado(false);
        setErrorMessage('');
    };

    /**
     * Registra el banco en el backend, protegido contra el doble envío. Ante un nombre duplicado
     * (409) muestra el aviso dentro del propio modal sin cerrarlo.
     */
    const handleCreate = async () => {
        if (!puedeCrear) {
            return;
        }

        setIsCreating(true);
        setErrorMessage('');

        try {
            const banco = await apiCreateBank({ nombre: nombre.trim() });
            onCreated(banco);
        } catch (error) {
            setErrorMessage(error.statusCode === 409
                ? error.message
                : `Error al registrar el banco: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="bank-modal">
            <div
                className="bank-modal-backdrop"
                onClick={onClose}
            />

            <div className="bank-modal-card">
                <h3 className="bank-modal-title">
                    Agregar nuevo banco
                </h3>

                <label className="bank-modal-label">
                    Nombre del banco *
                </label>
                <input
                    type="text"
                    value={nombre}
                    onChange={handleNombreChange}
                    maxLength={50}
                    autoFocus
                    className="bank-modal-input"
                />

                {similares.length > 0 && (
                    <div className="bank-modal-similar">
                        <p className="bank-modal-similar-title">
                            Ya existen bancos con un nombre semejante. ¿Quiso decir alguno de estos?
                        </p>
                        <ul className="bank-modal-similar-list">
                            {similares.map((bank) => (
                                <li key={bank.id_banco} className="bank-modal-similar-item">
                                    <span>{bank.nombre}</span>
                                    <button
                                        type="button"
                                        onClick={() => onSelectExisting(bank)}
                                        className="bank-modal-similar-btn"
                                    >
                                        Seleccionar
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <label className="bank-modal-confirm">
                            <input
                                type="checkbox"
                                checked={confirmado}
                                onChange={(e) => setConfirmado(e.target.checked)}
                            />
                            Confirmo que el banco no figura en la lista y deseo registrarlo.
                        </label>
                    </div>
                )}

                {errorMessage && (
                    <div className="bank-modal-message bank-modal-message--error">
                        {errorMessage}
                    </div>
                )}

                <div className="bank-modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bank-modal-btn-cancel"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={!puedeCrear}
                        onClick={handleCreate}
                        className={`bank-modal-btn-create ${puedeCrear ? '' : 'bank-modal-btn-create--disabled'}`}
                    >
                        {isCreating ? 'Registrando...' : 'Registrar Banco'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Control de búsqueda con alta asistida para seleccionar el banco emisor de un cheque.
 * Filtra de forma incremental el catálogo en memoria y solo fija el banco ante una selección
 * efectiva de la lista (clic o teclado). Es un componente controlado: el catálogo y el banco
 * seleccionado pertenecen al contenedor, que es notificado de cada cambio.
 * @param {Object} props - Propiedades del componente.
 * @param {Array<Object>} props.banks - Catálogo de bancos ({ id_banco, nombre }).
 * @param {number|string} props.value - Identificador del banco seleccionado ('' si no hay selección).
 * @param {Function} props.onChange - Notifica el identificador del banco elegido.
 * @param {Function} props.onBankCreated - Notifica el banco recién creado para incorporarlo al catálogo.
 * @param {boolean} [props.disabled=false] - Inhabilita la búsqueda y el alta.
 * @returns {JSX.Element} Selector de banco.
 */
const BankSelector = ({ banks, value, onChange, onBankCreated, disabled = false }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialName, setModalInitialName] = useState('');

    const selectedBank = banks.find((bank) => String(bank.id_banco) === String(value));
    const filteredBanks = banks.filter((bank) => normalizeText(bank.nombre).includes(normalizeText(query)));

    // Mientras la lista está abierta se muestra lo tecleado; al cerrarla, el banco efectivamente seleccionado
    const displayedText = isOpen ? query : (selectedBank ? selectedBank.nombre : '');

    /**
     * Abre la lista con el catálogo completo al ingresar al campo.
     */
    const handleFocus = () => {
        setQuery('');
        setHighlightedIndex(0);
        setIsOpen(true);
    };

    /**
     * Actualiza el texto de búsqueda y reinicia la opción resaltada.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setHighlightedIndex(0);
        setIsOpen(true);
    };

    /**
     * Al salir del campo sin elegir, descarta lo tecleado y vuelve a mostrar el banco seleccionado (o nada).
     */
    const handleBlur = () => {
        setIsOpen(false);
        setQuery('');
    };

    /**
     * Fija el banco elegido de la lista y cierra el desplegable.
     * @param {Object} bank - Banco seleccionado.
     */
    const handleSelect = (bank) => {
        onChange(bank.id_banco);
        setIsOpen(false);
        setQuery('');
    };

    /**
     * Navegación por teclado: flechas para recorrer, Enter para seleccionar y Escape para salir.
     * @param {Object} e - Evento de teclado del input.
     */
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((index) => Math.min(index + 1, filteredBanks.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((index) => Math.max(index - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen && filteredBanks[highlightedIndex]) {
                handleSelect(filteredBanks[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.target.blur();
        }
    };

    /**
     * Abre el modal de alta precargado con el texto de búsqueda vigente.
     */
    const handleOpenModal = () => {
        setModalInitialName(isOpen ? query : '');
        setIsOpen(false);
        setQuery('');
        setIsModalOpen(true);
    };

    /**
     * Incorpora el banco recién creado al catálogo del contenedor y lo deja seleccionado.
     * @param {Object} bank - Banco creado ({ id_banco, nombre }).
     */
    const handleBankCreated = (bank) => {
        onBankCreated(bank);
        onChange(bank.id_banco);
        setIsModalOpen(false);
    };

    /**
     * Selecciona un banco semejante ofrecido por el modal en lugar de crear un duplicado.
     * @param {Object} bank - Banco existente elegido.
     */
    const handleSelectExisting = (bank) => {
        onChange(bank.id_banco);
        setIsModalOpen(false);
    };

    return (
        <div className="bank-selector">
            <div className="bank-selector-field">
                <input
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    value={displayedText}
                    placeholder={selectedBank ? selectedBank.nombre : 'Buscar banco...'}
                    onFocus={handleFocus}
                    onChange={handleQueryChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className="bank-selector-input"
                />

                {isOpen && (
                    <ul
                        role="listbox"
                        className="bank-selector-list"
                    >
                        {filteredBanks.length === 0 ? (
                            <li className="bank-selector-empty">
                                Sin coincidencias. Puede agregarlo como nuevo banco.
                            </li>
                        ) : (
                            filteredBanks.map((bank, index) => (
                                <li
                                    key={bank.id_banco}
                                    role="option"
                                    aria-selected={index === highlightedIndex}
                                    // Se usa mousedown para seleccionar antes de que el blur cierre la lista
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(bank);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`bank-selector-option ${index === highlightedIndex ? 'bank-selector-option--active' : ''}`}
                                >
                                    {bank.nombre}
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>

            <button
                type="button"
                // Evita que el campo pierda el foco, para conservar el texto de búsqueda como precarga del modal
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenModal}
                disabled={disabled}
                title="Agregar nuevo banco"
                className="bank-selector-btn-add"
            >
                + Nuevo
            </button>

            {isModalOpen && (
                <BankCreateModal
                    initialName={modalInitialName}
                    banks={banks}
                    onClose={() => setIsModalOpen(false)}
                    onCreated={handleBankCreated}
                    onSelectExisting={handleSelectExisting}
                />
            )}
        </div>
    );
};

export default BankSelector;
