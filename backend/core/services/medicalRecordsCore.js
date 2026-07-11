// backend/core/services/medicalRecordsCore.js
const db = require('../../db/database');

exports.getByPatient = (patientId) => {
  return db.prepare(`
    SELECT * FROM medical_records WHERE patient_id = ?
    ORDER BY date DESC
  `).all(patientId);
};

exports.create = (data) => {
  if (!data.patient_id) throw new Error('El paciente es obligatorio');
  if (!data.date) throw new Error('La fecha es obligatoria');
  if (!data.description) throw new Error('La descripción es obligatoria');

  const stmt = db.prepare(`
    INSERT INTO medical_records (patient_id, date, description)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(data.patient_id, data.date, data.description);
  return { id: info.lastInsertRowid, ...data };
};