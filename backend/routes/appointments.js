const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const db = require('../db/database');

// GET /appointments - Obtener todas las citas
router.get('/', appointmentsController.getAll);

// GET /appointments/patient/:patientId - Obtener citas de un paciente
router.get('/patient/:patientId', appointmentsController.getByPatient);

// POST /appointments - Crear una nueva cita
router.post('/', appointmentsController.create);

// PUT /appointments/:id/status - Actualizar estado de una cita
router.put('/:id/status', appointmentsController.updateStatus);

// DELETE /appointments/:id - Eliminar una cita (opcional, lo dejamos por si acaso)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }
    res.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
});

module.exports = router;