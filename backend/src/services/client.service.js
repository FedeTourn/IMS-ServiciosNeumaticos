const Client = require('../models/Client');
const ClientCategory = require('../models/ClientCategory');
const formatter = require('../utils/data.formater');
const { isValidCUIT, isValidEmail} = require('../utils/validation');


class ClientService {

    static async getAllClients(options) {
        return await Client.findAll(options);
    };

    static async createClient(clientDTO) {

        const { apellido, nombre, segundo_nombre, cuit, email, categoria, provincia, ciudad, calle, numero, telefonos } = clientDTO;

        // 1. VALIDACIÓN BÁSICA DE CAMPOS OBLIGATORIOS
        if (!apellido || !nombre || !cuit || !provincia || !ciudad || !categoria) {
            throw { status: 400, message: "Apellido, Nombre, CUIT, Provincia, Ciudad y Categoría son campos obligatorios." };
        }

        //1.1 VALIDACION DE SEGURIDAD PARA CUIT Y EMAIL
        if (!isValidCUIT(clientDTO.cuit)) {
            throw { status: 400, message: "CUIT inválido según formato de verificación." };
        }
        
        if (!isValidEmail(clientDTO.email)) {
            throw { status: 400, message: "Formato de email inválido." };
        }

        // 2. NORMALIZACIÓN Y ESTANDARIZACIÓN A MAYÚSCULAS
        // Normalización del Nombre Completo
        const nombre_normalizado = [apellido, nombre, segundo_nombre]
            .filter(Boolean)
            .map(formatter.toUpperCase)
            .join(' ');
        /* const nombre_completo_parts = [
            formatter.toUpperCase(apellido),
            formatter.toUpperCase(nombre),
            segundo_nombre ? formatter.toUpperCase(segundo_nombre) : null
        ].filter(p => p !== null && p !== '');
        const nombre_normalizado = nombre_completo_parts.join(' '); // CONCATENACIÓN: Apellido Nombre SegundoNombre */

        // Normalización de la Dirección
        const direccion_normalizada = [provincia, ciudad, calle, numero]
            .filter(Boolean)
            .map(formatter.toUpperCase)
            .join(', ');
        /* const direccion_parts = [
            formatter.toUpperCase(provincia),
            formatter.toUpperCase(ciudad),
            calle ? formatter.toUpperCase(calle) : null,
            numero ? formatter.toUpperCase(numero) : null
        ].filter(p => p !== null && p !== '');
        const direccion_normalizada = direccion_parts.join(', '); // CONCATENACIÓN: Provincia, Ciudad, Calle, Numero */
        
        const clientData = {
            nombre: nombre_normalizado,
            direccion: direccion_normalizada,
            cuit: formatter.toUpperCase(cuit),
            email: email ? email.toLowerCase().trim() : null,
            categoria
        };

        // 3. CREAR CLIENTE PRINCIPAL

        let newClientId;
        try {
            newClientId = await Client.create(clientData);
        } catch (error) {
            // Transforma el error de MySQL a un error de negocio
            if (error.code === 'DUPLICATE_CLIENT_ENTRY') {
                throw { status: 409, message: "Ya existe un cliente con este CUIT o Email." };
            }
            throw error;
        }

        // 4. GUARDAR TELÉFONOS (Si existen)
        if (Array.isArray(telefonos) && telefonos.length > 0) {
            const phonePremises = telefonos
                .filter(phone => phone.numero && phone.numero.trim() !== '')
                .map(phone => Client.createPhone(
                    newClientId,
                    phone.numero.trim(),
                    phone.descripcion ? formatter.toUpperCase(phone.descripcion) : null

                ));
            await Promise.all(phonePremises);
            
            /* // Usamos Promise.all para guardar todos los teléfonos de forma concurrente
            await Promise.all(telefonos.map(phone => {
                if (phone.numero) { // Solo guarda si tiene un número
                        return Client.createPhone(
                        newClientId, 
                        phone.numero, 
                        phone.descripcion ? formatter.toUpperCase(phone.descripcion) : null
                    );
                }
            })); */
        }

        return { message: "Client created successfully.", id_cliente: newClientId };
    };

    static async updateClient(id_cliente, clientDTO) {
        // Solo permitimos modificar: dirección, email y categoría
        const {provincia, ciudad, calle, numero, email, categoria, telefonos} = clientDTO;

        // 1. VALIDACIÓN BÁSICA
        if (!provincia || !ciudad || !categoria) {
            throw {status: 400, message: "Provincia, Ciudad y Categoría son campos obligatorios para la dirección." };            
        }
        
        // 2. NORMALIZACIÓN DE DIRECCIÓN
        const direccion_normalizada = [provincia, ciudad, calle, numero]
            .filter(Boolean)
            .map(formatter.toUpperCase)
            .join(', ');

        /* const direccion_parts = [
            formatter.toUpperCase(provincia),
            formatter.toUpperCase(ciudad),
            calle ? formatter.toUpperCase(calle) : null,
            numero ? formatter.toUpperCase(numero) : null
        ].filter(p => p !== null && p !== '');
        const direccion_normalizada = direccion_parts.join(', '); // Provincia, Ciudad, Calle, Numero */
    
        
        // 3. ACTUALIZAR CLIENTE PRINCIPAL
        const clientData = {
            direccion: direccion_normalizada,
            email: email ? email.toLowerCase().trim() : null,
            categoria
        };

        try {
            await Client.update(id_cliente, clientData);
        } catch (error) {
            if (error.code === 'DUPLICATE_EMAIL_ENTRY') {
                throw { status: 409, message: "El Email ingresado ya existe." };
            }
            throw error;
        }


        // 4. SINCRONIZACIÓN DE TELÉFONOS
        
        // a. Obtener lista actual de teléfonos en la DB
        const currentPhonesDB = await Client.findAllPhonesByClient(id_cliente);
        const currentNumbers = new Set(currentPhonesDB.map(p => p.numero));
        
        // b. Identificar teléfonos válidos (con número) a mantener o crear
        const incomingPhones = (telefonos || [])
            .filter(p => p.numero && p.numero.trim() !== '')
            .map(p => ({
                numero: p.numero.trim(),
                descripcion: p.descripcion ? p.descripcion.trim() : null
            }));
        const incomingNumbers = new Set(incomingPhones.map(p => p.numero));

        // c. Eliminar teléfonos que ya no están en la lista (teléfonos eliminados)
        const deletePromises = currentPhonesDB
            .filter(p => !incomingNumbers.has(p.numero))
            .map(p => Client.deletePhone(id_cliente, p.numero));

        // d. Insertar nuevos
        const insertPromises = incomingPhones
            .filter(p => !currentNumbers.has(p.numero))
            .map(p => Client.createPhone(id_cliente, p.numero, p.descripcion ? formatter.toUpperCase(p.descripcion) : null));


        //const phonesToDelete = currentPhonesDB.filter(p => !incomingNumbers.has(p.numero));
        await Promise.all([...deletePromises, ...insertPromises]);
        return { message: "Client updated successfully." };

        // d. Crear/Actualizar teléfonos nuevos o existentes.
        // NOTA: En MySQL, INSERT IGNORE o INSERT ON DUPLICATE KEY UPDATE es más eficiente.
        // Usaremos `createPhone` y manejaremos el error de duplicado (si el modelo lo soporta, o
        // simplemente dejamos que falle si se intenta crear uno existente, ya que los cambios se
        // reflejarán por el nuevo array)
        
        // Por simplicidad, eliminamos los antiguos y reinsertamos los nuevos.
        // Pero el enfoque más limpio es: eliminar los quitados, e insertar los nuevos.
        
        // Insertar teléfonos nuevos (que no estaban en currentNumbers)
        /* const phonesToInsert = incomingPhones.filter(p => !currentNumbers.has(p.numero));
        await Promise.all(phonesToInsert.map(p => 
                Client.createPhone(id_cliente, p.numero, p.descripcion ? formatter.toUpperCase(p.descripcion) : null)
        )); */
        
        // NOTA: La modificación de la descripción de un teléfono existente requiere otra lógica (UPDATE).
        // Si quieres soportar la modificación de descripción, el UPDATE debe hacerse aquí.
        // Por ahora, solo soportamos agregar/eliminar teléfonos, y actualizamos la descripción
        // de los teléfonos que están en `incomingPhones` y también en `currentNumbers`.        
    };

    static async updateStatus(id_cliente, status){
        const affectedRows = await Client.updateStatus(id_cliente, status);

        if (affectedRows === 0) {
            throw { status: 404, message: "Cliente no encontrado." };
        }

        return { message: "Client updated." }
    }

/*     static async reactivateClient(id_cliente) {
        const affectedRows = await Client.updateStatus(id_cliente);
        
        if (affectedRows === 0) {
            throw { status: 404, message: "Client not found." }
        }

        return { message: "Client successfully reactivated." }
    }; */

    static async getCliendById(id_cliente) {
        const client = await Client.findById(id_cliente);

        if (!client) {
            throw { status: 404, message: "Client not found." };
        }
        
        // Obtener la lista de teléfonos y adjuntarla
        client.telefonos = await Client.findAllPhonesByClient(id_cliente); //------------------------------------------------------------------------
        return client;
    };

    static async getAllClientCategories() {
        return await ClientCategory.findAll();
    }
}

module.exports = ClientService