const db = require('../db/database');

module.exports = {
  getAppointments: (req, res) => {
    try {
      const appointments = db.prepare(`
        SELECT a.id, a.date, a.time, a.notes, p.name AS patient_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
      `).all();
      res.json(appointments);
    } catch (err) {
      console.error('Error al obtener citas:', err);
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  },

  addAppointment: (req, res) => {
    try {
      const { patient_id, date, time, notes } = req.body;
      const info = db.prepare('INSERT INTO appointments (patient_id, date, time, notes) VALUES (?, ?, ?, ?)').run(patient_id, date, time, notes);
      const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(info.lastInsertRowid);
      res.json({ success: true, appointment });
    } catch (err) {
      console.error('Error al agregar cita:', err);
      res.status(500).json({ error: 'Error al agregar cita' });
    }
  }
};
