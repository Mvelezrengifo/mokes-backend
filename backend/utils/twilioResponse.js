// twilioResponse.js - Envío de mensajes por WhatsApp usando Twilio
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_WHATSAPP = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

async function sendWhatsAppMessage(toNumber, message) {
  try {
    // Validar que el número tenga formato internacional (ej. +56912345678)
    let formattedNumber = toNumber;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    }

    const response = await client.messages.create({
      body: message,
      from: FROM_WHATSAPP,
      to: `whatsapp:${formattedNumber}`
    });
    console.log(`📱 WhatsApp enviado a ${toNumber}, SID: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendWhatsAppMessage };