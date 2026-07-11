// backend/utils/webSocketHandler.js
const openaiService = require('./openaiService');
const core = require('../core/app_core');
const businessMemory = require('../core/utils/businessMemoryService');
const { validateAppointment } = require('../core/utils/validators');

// Mapeo de acciones (con lógica de búsqueda/creación de paciente)
const actionHandlers = {
  create_appointment: async (params) => {
    let patientId = params.patientId;

    // Si no tiene patientId, intentar buscar por nombre
    if (!patientId && params.patientName) {
      const patient = core.patients.getByName(params.patientName);
      if (patient) {
        patientId = patient.id;
      } else {
        // Si no existe, preguntar si desea registrarlo (o crearlo automáticamente)
        // Por ahora, lo creamos con teléfono vacío (se pedirá después)
        const newPatient = core.patients.create({
          name: params.patientName,
          phone: '',
          email: '',
          document: ''
        });
        patientId = newPatient.id;
      }
    }

    if (!patientId) {
      throw new Error('No se pudo identificar al paciente. Por favor, proporciona un nombre válido.');
    }

    // Construir el objeto de cita
    const appointmentData = {
      patient_id: patientId,
      date: params.date,
      time: params.time,
      treatment: params.treatment || 'Consulta General',
      notes: params.notes || ''
    };

    return core.appointments.create(appointmentData);
  },

  register_patient: async (params) => {
    // Validar que los campos requeridos existan
    if (!params.name) throw new Error('El nombre es obligatorio');
    if (!params.phone) throw new Error('El teléfono es obligatorio');

    // Crear paciente solo con los campos que existen
    return core.patients.create({
      name: params.name,
      phone: params.phone,
      email: params.email || '',
      document: params.document || ''
    });
  },

  generate_invoice: async (params) => {
    // Lógica para generar factura (pendiente de implementar)
    console.log('💰 Generando factura:', params);
    return core.invoices.create(params);
  },

  add_knowledge: async (params) => {
    const { category, data } = params;

    if (category === 'services' || category === 'prices') {
      // El doctor puede decir: "Aura, recuerda que Lipoláser cuesta $150"
      // params.data será: { name: 'Lipoláser', price: 150, duration: 45 }
      return businessMemory.addService(data.name, data.price, data.duration);
    } else if (category === 'promotions') {
      // Aquí se pueden agregar promociones (similar)
      console.log('📢 Agregando promoción:', data);
      // Por ahora solo lo registramos
      return { success: true, message: 'Promoción registrada (demo)' };
    } else {
      throw new Error(`Categoría "${category}" no soportada para add_knowledge`);
    }
  }
};

async function handleTextMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    const { type, sessionId, text } = data;

    if (type === 'text') {
      console.log(`📝 Texto recibido: "${text}"`);

      // Procesar el texto con OpenAI
      const { action, parameters, reply } = await openaiService.processCommand(text);

      let actionResult = null;
      if (action && actionHandlers[action]) {
        try {
          actionResult = await actionHandlers[action](parameters);
        } catch (error) {
          console.error(`❌ Error ejecutando acción ${action}:`, error);
          ws.send(JSON.stringify({
            type: 'error',
            sessionId,
            text: `Error: ${error.message}`
          }));
          return;
        }
      }

      // Enviar respuesta al frontend
      ws.send(JSON.stringify({
        type: 'reply',
        sessionId,
        text: reply,
        action: action,
        actionResult: actionResult
      }));

    } else if (type === 'audio') {
      console.warn('⚠️ Mensaje de audio recibido, pero el WebSocket solo maneja texto.');
      ws.send(JSON.stringify({
        type: 'error',
        sessionId,
        text: 'Este servidor solo procesa comandos de texto. Usa el endpoint /transcribe para audio.'
      }));
    } else {
      console.warn(`⚠️ Tipo de mensaje desconocido: ${type}`);
    }
  } catch (error) {
    console.error('❌ Error en WebSocket handler:', error);
    ws.send(JSON.stringify({
      type: 'error',
      text: 'Lo siento, ocurrió un error al procesar tu mensaje.'
    }));
  }
}

module.exports = { handleTextMessage };