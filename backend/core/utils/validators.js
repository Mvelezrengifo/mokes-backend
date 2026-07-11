// backend/core/utils/validators.js
function validatePatient(data) {
  if (!data.name) throw new Error('El nombre del paciente es obligatorio');
  if (!data.phone) throw new Error('El teléfono es obligatorio');
  // "age" ya no se valida
}

function validateAppointment(data) {
  if (!data.patient_id) throw new Error('El paciente es obligatorio');
  if (!data.date) throw new Error('La fecha es obligatoria');
  if (!data.time) throw new Error('La hora es obligatoria');
  if (!data.treatment) throw new Error('El tratamiento es obligatorio');
  // Validar formato de fecha y hora
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(data.date)) throw new Error('Formato de fecha inválido (YYYY-MM-DD)');
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(data.time)) throw new Error('Formato de hora inválido (HH:MM)');
}

function validateInvoice(data) {
  if (!data.patient_id) throw new Error('El paciente es obligatorio');
  if (!data.total || data.total <= 0) throw new Error('El total debe ser mayor a 0');
  // ...
}

module.exports = {
  validatePatient,
  validateAppointment,
  validateInvoice,
};