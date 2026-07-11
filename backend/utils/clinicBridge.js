// backend/utils/clinicBridge.js
// Puente entre Aura (voz) y el Core central
const core = require('../core/app_core');

async function createAppointment(appointmentData) {
  try {
    const appointment = core.appointments.create(appointmentData);
    return { success: true, data: appointment };
  } catch (error) {
    console.error('Error en clinicBridge.createAppointment:', error);
    return { success: false, message: error.message };
  }
}

async function registerPatient(patientData) {
  try {
    const patient = core.patients.create(patientData);
    return { success: true, data: patient };
  } catch (error) {
    console.error('Error en clinicBridge.registerPatient:', error);
    return { success: false, message: error.message };
  }
}

async function generateInvoice(invoiceData) {
  try {
    // El Core ya maneja puntos e inventario automáticamente
    const invoice = core.invoices.create(invoiceData);
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error en clinicBridge.generateInvoice:', error);
    return { success: false, message: error.message };
  }
}

async function getPatientPoints(patientId) {
  try {
    const total = core.points.getTotal(patientId);
    return { success: true, points: total };
  } catch (error) {
    console.error('Error en clinicBridge.getPatientPoints:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  createAppointment,
  registerPatient,
  generateInvoice,
  getPatientPoints,
};