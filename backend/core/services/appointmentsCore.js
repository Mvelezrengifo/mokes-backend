// core/services/appointmentsCore.js
const db = require('../../db/database');
const { validateAppointment } = require('../utils/validators');

// Obtener lista de tratamientos válidos desde la base de datos
function getValidTreatments() {
  const rows = db.prepare('SELECT name FROM clinic_services').all();
  return rows.map(row => row.name);
}

exports.getAll = () => {
  return db.prepare(`
    SELECT a.*, p.name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    ORDER BY a.date DESC, a.time DESC
  `).all();
};

exports.getByPatient = (patientId) => {
  return db.prepare(`
    SELECT * FROM appointments WHERE patient_id = ?
    ORDER BY date DESC, time DESC
  `).all(patientId);
};

// ✅ NUEVO MÉTODO: Obtener citas por fecha específica
exports.getByDate = (date) => {
  return db.prepare(`
    SELECT a.*, p.name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.date = ?
    ORDER BY a.time
  `).all(date);
};

exports.create = (data) => {
  // 1. Validar campos requeridos
  validateAppointment(data);

  // 2. Validar que el tratamiento exista en clinic_services
  const validTreatments = getValidTreatments();
  if (!validTreatments.includes(data.treatment)) {
    throw new Error(`El tratamiento "${data.treatment}" no es válido. Opciones: ${validTreatments.join(', ')}`);
  }

  // 3. Validar que el paciente exista
  const patient = db.prepare('SELECT id, name FROM patients WHERE id = ?').get(data.patient_id);
  if (!patient) {
    throw new Error(`Paciente con ID ${data.patient_id} no encontrado`);
  }

  // 4. Validar formato de fecha (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(data.date)) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
  }

  // 5. Validar formato de hora (HH:MM)
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(data.time)) {
    throw new Error('Formato de hora inválido. Use HH:MM');
  }

  // 6. Validar que la fecha no sea en el pasado
  const today = new Date().toISOString().split('T')[0];
  if (data.date < today) {
    throw new Error('No se pueden agendar citas en fechas pasadas');
  }

  // 7. Guardar en la base de datos
  const stmt = db.prepare(`
    INSERT INTO appointments (patient_id, date, time, treatment, notes, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  const info = stmt.run(
    data.patient_id,
    data.date,
    data.time,
    data.treatment,
    data.notes || ''
  );

  // 8. Obtener la cita recién creada con el nombre del paciente
  const appointment = db.prepare(`
    SELECT a.*, p.name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.id = ?
  `).get(info.lastInsertRowid);

  return appointment;
};

exports.updateStatus = (id, status) => {
  const validStatus = ['pending', 'completed', 'cancelled'];
  if (!validStatus.includes(status)) {
    throw new Error(`Estado inválido. Opciones: ${validStatus.join(', ')}`);
  }
  const stmt = db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
  const result = stmt.run(status, id);
  if (result.changes === 0) throw new Error('Cita no encontrada');
  return { success: true, status };
};

exports.delete = (id) => {
  const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) throw new Error('Cita no encontrada');
  return { success: true };
};