// backend/controllers/mokesAiController.js
const openaiService = require('../utils/openaiService');
const core = require('../core/app_core');
const agenda = require('../core/services/agendaCore');
const notifications = require('../core/services/notificationsCore');
const queryParser = require('../core/utils/queryParser');
const businessMemory = require('../utils/businessMemory');
const twilioResponse = require('../utils/twilioResponse');

// =====================================================
// 🎯 MAPEO DE ACCIONES (compartido por texto y voz)
// =====================================================
const actionHandlers = {
  create_appointment: async (params) => core.appointments.create(params),
  register_patient: async (params) => core.patients.create(params),
  generate_invoice: async (params) => core.invoices.create(params),
  check_inventory: async (params) => core.inventory.checkStock(params.productId, params.quantity),
  get_points: async (params) => core.points.getTotal(params.patientId),
  add_knowledge: async (params) => businessMemory.addKnowledge(params.category, params.data),
};

// =====================================================
// ⌨️ COMANDO DE TEXTO (ya existente)
// =====================================================
exports.handleCommand = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    // 1. Intentar parsear con queryParser (rápido, sin OpenAI)
    const parsed = queryParser.parseNaturalLanguage(text);
    if (parsed && parsed.type === 'agenda_query') {
      const summary = agenda.getAppointmentsSummary(parsed.date);
      const reply = `Para el ${parsed.date}, hay ${summary.total} citas programadas. ${JSON.stringify(summary.byHour)}`;
      return res.json({ reply, action: 'agenda_query', data: summary });
    }

    // 2. Si no se pudo parsear, usar OpenAI (más caro, pero más potente)
    const { action, parameters, reply } = await openaiService.processCommand(text);

    let actionResult = null;
    if (action === 'create_appointment') {
      const result = await core.appointments.create(parameters);
      actionResult = result;
      // Notificar al doctor
      await notifications.notifyDoctor(result);
      // Enviar recordatorio al paciente (si tiene número)
      if (result.patient_phone) {
        await twilioResponse.sendWhatsAppMessage(result.patient_phone, `Su cita ha sido agendada para el ${result.date} a las ${result.time}.`);
      }
    } else if (action === 'cancel_appointment') {
      const result = await core.appointments.updateStatus(parameters.id, 'cancelled');
      actionResult = result;
    } else if (action === 'confirm_appointment') {
      const result = await core.appointments.updateStatus(parameters.id, 'confirmed');
      actionResult = result;
      // Enviar confirmación al paciente
      if (result.patient_phone) {
        await twilioResponse.sendWhatsAppMessage(result.patient_phone, `Su cita ha sido confirmada para el ${result.date} a las ${result.time}.`);
      }
    } else if (action === 'query_agenda') {
      const summary = agenda.getAppointmentsSummary(parameters.date);
      actionResult = summary;
    }

    return res.json({
      reply,
      action,
      actionResult,
    });

  } catch (error) {
    console.error('Error en handleCommand:', error);
    return res.status(500).json({
      reply: 'Ocurrió un error interno. Intenta de nuevo.',
    });
  }
};

// =====================================================
// 🎙️ COMANDO DE VOZ (archivo de audio - NUEVO)
// =====================================================
exports.handleVoiceCommand = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de audio' });
    }

    const audioBuffer = req.file.buffer;

    // 1. Transcribir audio con OpenAI Whisper
    const transcription = await openaiService.transcribeAudio(audioBuffer);
    const userMessage = transcription.text;

    console.log(`📝 Texto transcrito: "${userMessage}"`);

    // 2. Procesar el texto con el mismo flujo de OpenAI
    const { action, parameters, reply } = await openaiService.processCommand(userMessage);

    // 3. Ejecutar la acción usando el mapa compartido de handlers
    let actionResult = null;
    if (action && actionHandlers[action]) {
      actionResult = await actionHandlers[action](parameters);
    }

    // 4. Devolver respuesta (el frontend la reproducirá con TTS)
    return res.json({
      reply: reply,
      action: action,
      actionResult: actionResult,
    });

  } catch (error) {
    console.error('Error en voice-command:', error); // <--- ESTE LOG ES CLAVE
    res.status(500).json({ reply: 'Ocurrió un error al procesar el audio. Intenta de nuevo.' });
  }
};