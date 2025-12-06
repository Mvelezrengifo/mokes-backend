import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    birthdate: "",
    email: "",
    phone: "",
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  // Traer pacientes
  const fetchPatients = async () => {
    try {
      const res = await axios.get("/api/patients");
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los pacientes");
      setPatients([]);
    }
  };

  // Crear paciente
  const createPatient = async () => {
    try {
      await axios.post("/api/patients", form);
      setForm({ name: "", birthdate: "", email: "", phone: "" });
      fetchPatients();
    } catch (err) {
      console.error(err);
      setError("Error al crear el paciente");
    }
  };

  // Editar paciente
  const updatePatient = async (id) => {
    try {
      await axios.put(`/api/patients/${id}`, form);
      setForm({ name: "", birthdate: "", email: "", phone: "" });
      setEditing(null);
      fetchPatients();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el paciente");
    }
  };

  // Eliminar paciente
  const deletePatient = async (id) => {
    try {
      await axios.delete(`/api/patients/${id}`);
      fetchPatients();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el paciente");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="content">
      <h2>Pacientes</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Formulario en línea */}
      <div
        className="card-dashboard"
        style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          placeholder="Nombre paciente"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="date"
          placeholder="Fecha de nacimiento"
          max={new Date().toISOString().split("T")[0]}
          value={form.birthdate}
          onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
        />
        <input
          placeholder="Correo"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        {editing ? (
          <button onClick={() => updatePatient(editing)}>Actualizar</button>
        ) : (
          <button onClick={createPatient}>Agregar</button>
        )}
      </div>

      {/* Lista de pacientes */}
      <ul>
        {Array.isArray(patients) &&
          patients.map((p) => (
            <li key={p.id}>
              {p.name} - {p.birthdate} - {p.email} - {p.phone}
              <div className="card-buttons">
                <button
                  onClick={() => {
                    setForm({
                      name: p.name,
                      birthdate: p.birthdate,
                      email: p.email,
                      phone: p.phone,
                    });
                    setEditing(p.id);
                  }}
                >
                  Editar
                </button>
                <button onClick={() => deletePatient(p.id)}>Eliminar</button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
