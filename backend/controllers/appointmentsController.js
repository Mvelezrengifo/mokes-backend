const core = require('../core/app_core');

exports.getAll = (req, res) => {
  try {
    const appointments = core.appointments.getAll();
    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener citas' });
  }
};

exports.getByPatient = (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = core.appointments.getByPatient(patientId);
    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas del paciente:', error);
    res.status(500).json({ success: false, message: 'Error al obtener citas' });
  }
};

exports.create = (req, res) => {
  try {
    const appointmentData = req.body;
    const appointment = core.appointments.create(appointmentData);
    res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear cita'
    });
  }
};

exports.updateStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = core.appointments.updateStatus(id, status);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar estado'
    });
  }
};

exports.delete = (req, res) => {
  try {
    const { id } = req.params;
    const result = core.appointments.delete(id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar cita'
    });
  }
};