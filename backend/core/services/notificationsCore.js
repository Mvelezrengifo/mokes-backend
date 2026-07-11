// backend/core/services/notificationsCore.js
const twilioResponse = require('../../utils/twilioResponse');
const db = require('../../db/database');

// Enviar recordatorio al paciente
async function sendAppointmentReminder(appointmentId) {
  const stmt = db.prepare(`
    SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.id = ?
  `);
  const appointment = stmt.get(appointmentId);
  if (!appointment) throw new Error('Cita no encontrada');
  if (!appointment.patient_phone) throw new Error('El paciente no tiene número de teléfono');

  const message = `Recordatorio: Tienes una cita programada para el ${appointment.date} a las ${appointment.time} en Mokes-Clinic. Tratamiento: ${appointment.treatment}.`;
  await twilioResponse.sendWhatsAppMessage(appointment.patient_phone, message);
  return { success: true, message: 'Recordatorio enviado' };
}

// Notificar al doctor sobre una nueva cita
async function notifyDoctor(appointment) {
  // Por ahora, solo log
  console.log(`📢 Nueva cita agendada: ${appointment.patient_name} - ${appointment.date} a las ${appointment.time}`);
  // En el futuro, esto podría ser una llamada o mensaje al doctor
  return { success: true };
}

module.exports = {
  sendAppointmentReminder,
  notifyDoctor,
};