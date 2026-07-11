// backend/controllers/vapiWebhookController.js
// Controlador para recibir webhooks de Vapi y ejecutar acciones del Core

const core = require('../core/app_core');
const businessMemory = require('../core/utils/businessMemoryService');
const { sendWhatsAppMessage } = require('../utils/twilioResponse');

// Verificar que la petición venga de Vapi (usando el secreto compartido)
function validateVapiRequest(req) {
  const vapiSecret = process.env.VAPI_SECRET_KEY;
  if (!vapiSecret) {
    console.warn('⚠️ VAPI_SECRET_KEY no configurada en .env');
    return true; // Permitir en desarrollo, pero en producción debe estar configurada
  }
  const receivedSecret = req.headers['x-vapi-secret'];
  if (receivedSecret !== vapiSecret) {
    console.error('❌ Secreto de Vapi inválido');
    return false;
  }
  return true;
}

/**
 * Maneja los webhooks entrantes de Vapi.
 * Vapi envía un POST con la estructura:
 * {
 *   "message": {
 *     "type": "tool-calls",
 *     "toolCalls": [{ "id": "...", "function": { "name": "create_appointment", "arguments": "{\"patientName\":\"...\"}" } }]
 *   },
 *   "assistantId": "...",
 *   "callId": "..."
 * }
 */
async function handleVapiWebhook(req, res) {
  try {
    // 1. Validar autenticación
    if (!validateVapiRequest(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const payload = req.body;
    console.log('📩 Webhook recibido de Vapi:', JSON.stringify(payload, null, 2));

    // 2. Extraer la información del webhook
    const { message, callId, assistantId } = payload;
    if (!message || !message.toolCalls) {
      // Puede ser un evento de conversación sin tool calls (ej. saludo)
      console.log('ℹ️ Evento sin tool calls, ignorando');
      return res.status(200).json({ message: 'OK' });
    }

    // 3. Procesar cada tool call (normalmente solo viene uno)
    const results = [];
    for (const toolCall of message.toolCalls) {
      const { id, function: func } = toolCall;
      const toolName = func.name;
      const parameters = JSON.parse(func.arguments || '{}');

      console.log(`🔧 Ejecutando tool: ${toolName}`, parameters);

      try {
        let result = null;

        // Mapear tools a funciones del Core
        switch (toolName) {
          case 'create_appointment':
            result = await handleAgendarCita(parameters);
            break;
          case 'register_patient':
            result = await handleRegisterPatient(parameters);
            break;
          case 'generate_invoice':
            result = await handleGenerateInvoice(parameters);
            break;
          case 'get_today_appointments':
            result = await handleGetTodayAppointments(parameters);
            break;
          case 'add_knowledge':
            result = await handleAddKnowledge(parameters);
            break;
          case 'send_whatsapp_reminder':
            result = await handleSendWhatsAppReminder(parameters);
            break;
          default:
            result = { error: `Tool "${toolName}" no implementado` };
        }

        results.push({
          toolCallId: id,
          result: result
        });

      } catch (error) {
        console.error(`❌ Error ejecutando tool ${toolName}:`, error);
        results.push({
          toolCallId: id,
          result: { error: error.message || 'Error interno' }
        });
      }
    }

    // 4. Responder a Vapi con los resultados
    return res.json({
      results: results
    });

  } catch (error) {
    console.error('❌ Error en webhook de Vapi:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// =============================================
// HANDLERS PARA CADA TOOL
// =============================================

// =============================================
// HANDLER PARA agendarCita (unificado)
// =============================================
async function handleAgendarCita(params) {
  // params: { nombre_paciente, documento_paciente, telefono_paciente, fecha_cita, hora_cita, servicio_motivo, precio_servicio }
  const { nombre_paciente, documento_paciente, telefono_paciente, fecha_cita, hora_cita, servicio_motivo, precio_servicio } = params;

  // 1. Buscar paciente por documento o teléfono
  let patient = core.patients.getByDocument(documento_paciente);
  if (!patient && telefono_paciente) {
    patient = core.patients.getByPhone(telefono_paciente);
  }

  // 2. Si no existe, crear paciente
  if (!patient) {
    patient = core.patients.create({
      name: nombre_paciente,
      document: documento_paciente,
      phone: telefono_paciente,
      email: '' // opcional
    });
    console.log(`👤 Paciente creado: ${nombre_paciente} (ID: ${patient.id})`);
  } else {
    // Actualizar datos si han cambiado (nombre, teléfono)
    if (patient.name !== nombre_paciente || patient.phone !== telefono_paciente) {
      core.patients.update(patient.id, {
        name: nombre_paciente,
        phone: telefono_paciente,
        document: documento_paciente
      });
      console.log(`📝 Datos de paciente actualizados: ${nombre_paciente}`);
    }
  }

  // 3. Crear la cita con el servicio y precio
  const appointmentData = {
    patient_id: patient.id,
    date: fecha_cita,
    time: hora_cita,
    treatment: servicio_motivo,
    notes: `Precio: ${precio_servicio}`,
    price: parseFloat(precio_servicio)
  };

  const appointment = core.appointments.create(appointmentData);
  console.log(`📅 Cita creada: ${appointment.id} para ${nombre_paciente} el ${fecha_cita} a las ${hora_cita} (${servicio_motivo} - $${precio_servicio})`);

  // 4. (Opcional) Enviar WhatsApp con confirmación
  if (telefono_paciente) {
    try {
      await sendWhatsAppMessage(
        telefono_paciente,
        `Hola ${nombre_paciente}, tu cita de ${servicio_motivo} ha sido agendada para el ${fecha_cita} a las ${hora_cita}. ¡Te esperamos!`
      );
    } catch (waError) {
      console.warn('⚠️ Error enviando WhatsApp:', waError.message);
    }
  }

  return {
    success: true,
    message: `Cita agendada exitosamente para ${nombre_paciente} el ${fecha_cita} a las ${hora_cita} (${servicio_motivo} - $${precio_servicio})`,
    patientId: patient.id,
    appointmentId: appointment.id
  };
}

async function handleRegisterPatient(params) {
  // params: { name, phone, email, age }
  const { name, phone, email, age } = params;
  const patient = core.patients.create({ name, phone, email, age });
  return {
    success: true,
    message: `Paciente ${name} registrado exitosamente`,
    patientId: patient.id
  };
}

async function handleGenerateInvoice(params) {
  // params: { patientId, amount, items, description }
  const invoice = core.invoices.create(params);
  return {
    success: true,
    message: `Factura generada exitosamente con ID ${invoice.id}`,
    invoiceId: invoice.id
  };
}

async function handleGetTodayAppointments(params) {
  // params: {} (opcional: date)
  const date = params.date || new Date().toISOString().split('T')[0];
  const appointments = core.appointments.getByDate(date);
  const count = appointments.length;
  let message = `Tienes ${count} cita${count !== 1 ? 's' : ''} para hoy ${date}.`;
  if (count > 0) {
    const list = appointments.map(a => `${a.time} - ${a.patient_name} (${a.treatment})`).join('. ');
    message += ' ' + list;
  }
  return {
    success: true,
    message: message,
    appointments: appointments
  };
}

async function handleAddKnowledge(params) {
  // params: { category, data }
  const { category, data } = params;
  if (category === 'service') {
    const result = businessMemory.addService(data.name, data.price, data.duration);
    return {
      success: true,
      message: `Servicio "${data.name}" guardado exitosamente con precio $${data.price}`,
      result: result
    };
  } else if (category === 'promotion') {
    businessMemory.addPromotion(data);
    return {
      success: true,
      message: `Promoción "${data.name}" guardada exitosamente`
    };
  }
  return {
    success: false,
    message: `Categoría "${category}" no soportada para add_knowledge`
  };
}

async function handleSendWhatsAppReminder(params) {
  // params: { phone, message }
  const { phone, message } = params;
  const result = await sendWhatsAppMessage(phone, message);
  return {
    success: result.success,
    message: result.success ? 'WhatsApp enviado exitosamente' : 'Error enviando WhatsApp'
  };
}

module.exports = {
  handleVapiWebhook
};