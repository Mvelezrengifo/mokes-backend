// backend/core/services/patientsCore.js
// Servicio de pacientes – CRUD básico sin campo "age"
const db = require('../../db/database');

// No se usa "age" porque la tabla patients no lo tiene
function validatePatient(data) {
  if (!data.name) throw new Error('El nombre del paciente es obligatorio');
  if (!data.phone) throw new Error('El teléfono es obligatorio');
  // Los demás campos (email, document) son opcionales
}

exports.getAll = () => {
  return db.prepare('SELECT * FROM patients ORDER BY name').all();
};

exports.getById = (id) => {
  return db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
};

// ✅ MÉTODO MEJORADO: Búsqueda exacta sin importar mayúsculas/minúsculas
exports.getByName = (name) => {
  return db.prepare('SELECT * FROM patients WHERE name = ? COLLATE NOCASE').get(name);
};

exports.create = (data) => {
  // Validar campos requeridos
  if (!data.name) throw new Error('El nombre es obligatorio');
  if (!data.phone) throw new Error('El teléfono es obligatorio');

  // Solo guardamos los campos que existen en la tabla
  const stmt = db.prepare(`
    INSERT INTO patients (name, phone, email, document)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.name,
    data.phone,
    data.email || '',
    data.document || ''
  );
  return { id: info.lastInsertRowid, ...data };
};

exports.update = (id, data) => {
  const stmt = db.prepare(`
    UPDATE patients SET name = ?, phone = ?, email = ?, document = ?
    WHERE id = ?
  `);
  const result = stmt.run(data.name, data.phone, data.email || '', data.document || '', id);
  if (result.changes === 0) throw new Error('Paciente no encontrado');
  return { id, ...data };
};

exports.delete = (id) => {
  const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) throw new Error('Paciente no encontrado');
  return { success: true };
};