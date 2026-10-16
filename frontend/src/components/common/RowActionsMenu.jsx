import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Separacion vertical (px) entre el boton disparador y el menu desplegado
const SEPARACION_MENU = 4;

/**
 * Menu desplegable de acciones por fila (kebab). El menu se renderiza en un portal sobre el body
 * con posicion fija, calculada desde el boton, para que el contenedor con scroll de una tabla
 * no lo recorte. Se cierra con un clic afuera, con Escape, al redimensionar o al hacer scroll.
 * @param {Object} props - Propiedades del componente.
 * @param {Array<{label: string, onClick: function, tone?: string, disabled?: boolean}>} props.items -
 * Acciones del menu; `tone` admite "accept" o "reject" para destacar su naturaleza.
 * @param {boolean} [props.disabled=false] - Pasiva el boton disparador.
 * @param {string} [props.label='Más acciones'] - Texto accesible del boton disparador.
 */
const RowActionsMenu = ({ items, disabled = false, label = 'Más acciones' }) => {
    // Posicion del menu en pantalla; null mientras esta cerrado
    const [position, setPosition] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const isOpen = position !== null;

    useEffect(() => {
        if (!isOpen) return undefined;

        const close = () => setPosition(null);

        const handleOutsideClick = (event) => {
            const dentroDelMenu = menuRef.current && menuRef.current.contains(event.target);
            const dentroDelBoton = buttonRef.current && buttonRef.current.contains(event.target);
            if (!dentroDelMenu && !dentroDelBoton) close();
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') close();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', close);
        // En captura, para cerrar tambien ante el scroll de contenedores internos
        window.addEventListener('scroll', close, true);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
        };
    }, [isOpen]);

    // Abre el menu alineado al borde derecho del boton, o lo cierra si ya estaba abierto
    const handleToggle = () => {
        if (isOpen) {
            setPosition(null);
            return;
        }
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + SEPARACION_MENU,
            right: window.innerWidth - rect.right
        });
    };

    const handleItemClick = (item) => {
        setPosition(null);
        item.onClick();
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={label}
                className="row-menu-trigger"
            >
                <svg className="row-menu-trigger-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="12" cy="19" r="1.75" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className="row-menu-list"
                    style={{ top: position.top, right: position.right }}
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            disabled={item.disabled}
                            onClick={() => handleItemClick(item)}
                            className={`row-menu-item${item.tone ? ` row-menu-item--${item.tone}` : ''}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

export default RowActionsMenu;
