// frontend/src/pages/Patients.jsx
import React, { useEffect, useState } from "react";
import { getPatients, createPatient } from "../services/patientsService";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const data = await getPatients();
    setPatients(data);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!name) return;
    const newPatient = await createPatient({ name, email, phone });
    if (newPatient) {
      setPatients([...patients, newPatient]);
      setName(""); setEmail(""); setPhone("");
    }
  };

  return (
    <div>
      <h1>Pacientes</h1>
      <form onSubmit={handleAddPatient}>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit">Agregar Paciente</button>
      </form>

      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} - {p.email} - {p.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Patients;
