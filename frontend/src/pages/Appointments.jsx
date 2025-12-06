import React, { useState, useEffect } from "react";
import { getAppointments, createAppointment, cancelAppointment } from "../services/appointmentsService";
import { getPatients } from "../services/patientsService";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: "", date: "", time: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  const fetchPatients = async () => { setPatients(await getPatients()); };
  const fetchAppointments = async () => { setAppointments(await getAppointments()); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) return alert("Selecciona un paciente");

    const selectedDate = new Date(form.date);
    selectedDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (selectedDate < today) return alert("No puedes programar citas en el pasado");

    setLoading(true);
    const result = await createAppointment(form);
    setLoading(false);

    if (result && result.appointment) {
      setForm({ patient_id: "", date: "", time: "", notes: "" });
      fetchAppointments();
      alert("Cita creada correctamente ✅");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro quieres cancelar esta cita?")) return;
    setLoading(true);
    const result = await cancelAppointment(id);
    setLoading(false);
    if (result && result.success) {
      fetchAppointments();
      alert("Cita cancelada correctamente ✅");
    }
  };

  return (
    <div className="content">
      <h2>Citas</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select name="patient_id" value={form.patient_id} onChange={handleChange} required>
          <option value="">Selecciona un paciente</option>
          {patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
        <input type="time" name="time" value={form.time} onChange={handleChange} required />
        <input type="text" name="notes" placeholder="Motivo / Notas" value={form.notes} onChange={handleChange} />
        <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear Cita"}</button>
      </form>

      <h3>Lista de Citas</h3>
      {appointments.length === 0 ? (
        <p>Aún no hay citas programadas.</p>
      ) : (
        <ul>
          {appointments.map(a => {
            const patient = patients.find(p => p.id === a.patient_id);
            return (
              <li key={a.id}>
                {patient ? patient.name : "Paciente eliminado"} - {a.date} {a.time} - {a.notes}
                <button onClick={() => handleDelete(a.id)} disabled={loading}>Cancelar</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
