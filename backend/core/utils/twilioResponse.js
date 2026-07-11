// backend/utils/twilioResponse.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_WHATSAPP = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// Enviar mensaje por WhatsApp
async function sendWhatsAppMessage(toNumber, message) {
  // ... (ya existe)
}

// Hacer una llamada saliente (con TTS)
async function makeCall(toNumber, message) {
  try {
    const response = await client.calls.create({
      to: toNumber,
      from: FROM_PHONE,
      twiml: `<Response><Say language="es-MX">${message}</Say></Response>`,
    });
    console.log(`📞 Llamada iniciada a ${toNumber}, SID: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('Error en makeCall:', error);
    return { success: false, error: error.message };
  }
}

// Enviar recordatorio por llamada (ej. "Recordatorio de cita mañana")
async function sendVoiceReminder(appointment) {
  const message = `Hola ${appointment.patient_name}, le recordamos que tiene una cita programada para mañana a las ${appointment.time} en Mokes-Clinic. Por favor, confirme su asistencia.`;
  return await makeCall(appointment.patient_phone, message);
}

module.exports = {
  sendWhatsAppMessage,
  makeCall,
  sendVoiceReminder,
};