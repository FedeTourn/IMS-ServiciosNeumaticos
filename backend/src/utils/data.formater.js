/**
 * Convierte una cadena a mayúsculas.
 * @param {string} value
 * @returns {string}
 */
exports.toUpperCase = (value) => {
    if (typeof value === 'string') {
        return value.toUpperCase().trim();
    }
    return value;
};

/**
 * Convierte una cadena a formato Título (Capitalize).
 * @param {string} value
 * @returns {string}
 */
exports.toTitleCase = (value) => {
    if (typeof value === 'string') {
        return value.toLowerCase().split(' ').map(function(word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }
    return value;
};