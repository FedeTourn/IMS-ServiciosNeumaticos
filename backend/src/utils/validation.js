/**
 * Valida el formato de un CUIT argentino (formato XX-XXXXXXXX-X)
 */
export const isValidCUIT = (cuit) => {
    if (!cuit) return false;
    const cleanCuit = cuit.replace(/-/g, '');
    if (cleanCuit.length !== 11) return false;
    
    // Algoritmo de verificación de CUIT (módulo 11)
    const multiplier = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = cleanCuit.split('').map(Number);
    const verifier = digits.pop();
    const sum = digits.reduce((acc, curr, i) => acc + (curr * multiplier[i]), 0);
    const rest = sum % 11;
    const calculatedVerifier = rest === 0 ? 0 : (rest === 1 ? 9 : 11 - rest);
    
    return verifier === calculatedVerifier;
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email) => {
    if (!email) return true; // Si es opcional, consideramos válido si está vacío
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};