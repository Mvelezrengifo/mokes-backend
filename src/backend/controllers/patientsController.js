const db = require('../db/database');

// Obtener todos los pacientes
function getAllPatients(req, res) {
  try {
    const patients = db.prepare('SELECT * FROM patients').all();
    res.json(patients);
  } catch (err) {
    console.error('Error al obtener pacientes:', err);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
}

// Obtener un paciente por ID
function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json(patient);
  } catch (err) {
    console.error('Error al obtener paciente:', err);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
}

// Crear nuevo paciente
function createPatient(req, res) {
  try {
    const { name, email, phone } = req.body;

    const info = db
      .prepare('INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)')
      .run(name, email, phone);

    const patient = db
      .prepare('SELECT * FROM patients WHERE id = ?')
      .get(info.lastInsertRowid);

    res.json({ success: true, patient });
  } catch (err) {
    console.error('Error al crear paciente:', err);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
}

// Actualizar paciente
function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const exists = db.prepare('SELECT id FROM patients WHERE id = ?').get(id);
    if (!exists) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    db.prepare(
      'UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?'
    ).run(name, email, phone, id);

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    res.json({ success: true, updated });
  } catch (err) {
    console.error('Error al actualizar paciente:', err);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
}

// Eliminar paciente
function deletePatient(req, res) {
  try {
    const { id } = req.params;

    const exists = db.prepare('SELECT id FROM patients WHERE id = ?').get(id);
    if (!exists) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    db.prepare('DELETE FROM patients WHERE id = ?').run(id);

    res.json({ success: true, message: 'Paciente eliminado' });
  } catch (err) {
    console.error('Error al eliminar paciente:', err);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};

