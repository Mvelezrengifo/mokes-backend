// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { getPatients, createPatient, getPatientHistory, getPatientHistoryByDate, savePatientHistory, deletePatientHistory, deletePatient } from "../services/patientsService";
import { getAppointments, createAppointment, cancelAppointment } from "../services/appointmentsService";
import Inventory from "./Inventory";
import { getMedicalRecords, createMedicalRecord, deleteMedicalRecord } from "../services/medicalRecordsService";
import { getPoints, createPoint, deletePoint } from "../services/pointsService";

function Dashboard() {
  // Pacientes
  const [patients, setPatients] = useState([]);
  const [newPatient, setNewPatient] = useState({ name: "", email: "", phone: "", age: "" });
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyPatients, setHistoryPatients] = useState([]);
  const [historyDate, setHistoryDate] = useState("");

  // Citas
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ patient_id: "", date: "", time: "", notes: "" });

  // Historia Clínica
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({ patient_id: "", date: "", description: "" });

  // Facturación
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({ patient_id: "", description: "", amount: "" });

  // Puntos
  const [points, setPoints] = useState([]);
  const [newPoint, setNewPoint] = useState({ patient_id: "", points: "" });
  const [showAllPatients, setShowAllPatients] = useState(false);
  const handleDeletePatient = async (id) => {
    const p = patients.find(x => String(x.id) === String(id));
    const name = p?.name || id;
    if (!confirm(`¿Eliminar paciente ${name}?`)) return;
    const ok = await deletePatient(id);
    if (ok) {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      if (String(newAppointment.patient_id) === String(id)) {
        const next = updated[updated.length - 1]?.id || "";
        setNewAppointment(prev => ({ ...prev, patient_id: next }));
      }
    }
  };

  // Sección activa
  const [activeSection, setActiveSection] = useState("pacientes");

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchHistory();
    fetchMedicalRecords();
    fetchPoints();
  }, []);

  const fetchPatients = async () => {
    const data = await getPatients();
    setPatients(data);
    if (data.length > 0) setNewAppointment(prev => ({ ...prev, patient_id: data[data.length - 1].id }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.age) return;
    const added = await createPatient(newPatient);
    if (added) {
      setPatients([...patients, added]);
      setNewPatient({ name: "", email: "", phone: "", age: "" });
      setNewAppointment(prev => ({ ...prev, patient_id: added.id }));
    }
  };

  const fetchHistory = async () => {
    const entries = await getPatientHistory();
    setHistoryEntries(entries);
  };

  const handleSaveTodayHistory = async () => {
    const saved = await savePatientHistory();
    if (saved) {
      await fetchHistory();
    }
  };

  const handleViewHistoryByDate = async () => {
    if (!historyDate) return;
    const snap = await getPatientHistoryByDate(historyDate);
    setHistoryPatients(snap && Array.isArray(snap.patients) ? snap.patients : []);
  };

  const handleDeleteHistory = async (id) => {
    const h = historyEntries.find(x => x.id === id);
    const label = h?.date ? `del día ${h.date}` : "del día";
    if (!confirm(`¿Eliminar historial ${label}?`)) return;
    const ok = await deletePatientHistory(id);
    if (ok) {
      await fetchHistory();
      if (historyPatients.length) setHistoryPatients([]);
    }
  };

  const fetchAppointments = async () => {
    const data = await getAppointments();
    setAppointments(data);
  };

  const fetchMedicalRecords = async () => {
    const data = await getMedicalRecords();
    setMedicalRecords(data);
  };

  const fetchPoints = async () => {
    const data = await getPoints();
    setPoints(data);
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!newAppointment.patient_id || !newAppointment.date || !newAppointment.time) return;
    const added = await createAppointment(newAppointment);
    if (added) {
      setAppointments([...appointments, added]);
      setNewAppointment(prev => ({ ...prev, date: "", time: "", notes: "" }));
    }
  };

  const handleCancelAppointment = async (id) => {
    const a = appointments.find(x => x.id === id);
    const pname = patients.find(p => p.id === a?.patient_id)?.name || a?.patient_id || "";
    const when = a ? `${a.date} ${a.time}` : "";
    if (!confirm(`¿Cancelar cita de ${pname} (${when})?`)) return;
    const success = await cancelAppointment(id);
    if (success) setAppointments(appointments.filter(a => a.id !== id));
  };

  const handleAddInvoice = (e) => {
    e.preventDefault();
    if (!newInvoice.patient_id || !newInvoice.amount) return;
    const invoice = { id: invoices.length + 1, ...newInvoice };
    setInvoices([...invoices, invoice]);
    setNewInvoice({ patient_id: newInvoice.patient_id, description: "", amount: "" });
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    if (!newPoint.patient_id || !newPoint.points) return;
    const added = await createPoint({ patient_id: newPoint.patient_id, points: Number(newPoint.points) });
    if (added) {
      setPoints([added, ...points]);
      setNewPoint({ patient_id: newPoint.patient_id, points: "" });
    }
  };

  const handleDeletePoint = async (id) => {
    const rec = points.find(x => x.id === id);
    const pname = patients.find(p => p.id === rec?.patient_id)?.name || rec?.patient_id || "";
    const pts = rec?.points ?? "";
    if (!confirm(`¿Eliminar ${pts} puntos de ${pname}?`)) return;
    const ok = await deletePoint(id);
    if (ok) setPoints(points.filter(p => p.id !== id));
  };

  // Estilos rápidos
  const containerStyle = { display: "flex", minHeight: "80vh" };
  const menuStyle = { width: "220px", padding: "20px", borderRight: "1px solid #ccc" };
  const contentStyle = { flex: 1, padding: "20px" };
  const logoStyle = { display: "block", margin: "0 auto 20px", height: "100px" };
  const buttonStyle = { display: "block", width: "100%", marginBottom: "10px" };
  const visiblePatients = showAllPatients ? patients : patients.slice(0, 4);

  return (
    <div>
      {/* Menu lateral */}
      <div style={containerStyle}>
        <div style={menuStyle}>
          <img src="/logo.png" alt="Logo" style={logoStyle} />
          <button style={buttonStyle} onClick={() => setActiveSection("pacientes")}>Pacientes y Citas</button>
          <button style={buttonStyle} onClick={() => setActiveSection("historia")}>Historia Clínica</button>
          <button style={buttonStyle} onClick={() => setActiveSection("facturacion")}>Facturación</button>
          <button style={buttonStyle} onClick={() => setActiveSection("puntos")}>Puntos Acumulados</button>
          <button style={buttonStyle} onClick={() => setActiveSection("inventario")}>Inventario</button>
        </div>

        {/* Contenido */}
        <div style={contentStyle}>
          {activeSection === "pacientes" && (
            <div>
              <h2>Pacientes</h2>
              <form onSubmit={handleAddPatient} style={{ marginBottom: "10px" }}>
                <input placeholder="Nombre" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
                <input placeholder="Edad" type="number" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                <input placeholder="Email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
                <input placeholder="Teléfono" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                <button type="submit">Agregar Paciente</button>
              </form>
              <table border="1" cellPadding="5" cellSpacing="0" style={{ marginBottom: "20px" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePatients.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.age}</td>
                      <td>{p.email}</td>
                      <td>{p.phone}</td>
                      <td><button onClick={() => handleDeletePatient(p.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients.length > 4 && (
                <button onClick={() => setShowAllPatients(!showAllPatients)}>
                  {showAllPatients ? "Mostrar menos" : "Mostrar todos"}
                </button>
              )}

              <h2>Citas</h2>
              <form onSubmit={handleAddAppointment} style={{ marginBottom: "10px" }}>
                <select value={newAppointment.patient_id} onChange={(e) => setNewAppointment({ ...newAppointment, patient_id: e.target.value })}>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} />
                <input type="time" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                <input placeholder="Notas" value={newAppointment.notes} onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })} />
                <button type="submit">Agregar Cita</button>
              </form>
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Notas</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{patients.find(p => p.id === a.patient_id)?.name || a.patient_id}</td>
                      <td>{a.date}</td>
                      <td>{a.time}</td>
                      <td>{a.notes}</td>
                      <td><button onClick={() => handleCancelAppointment(a.id)}>Cancelar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "20px" }}>
                <h3>Vista por día</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
                  <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
                  <button onClick={handleViewHistoryByDate}>Ver</button>
                  <button onClick={handleSaveTodayHistory}>Guardar historia de hoy</button>
                </div>
                <table border="1" cellPadding="5" cellSpacing="0" style={{ marginBottom: "20px" }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Edad</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPatients.length === 0 ? (
                      <tr><td colSpan="5">Sin datos para la fecha</td></tr>
                    ) : (
                      historyPatients.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.age}</td>
                          <td>{p.email}</td>
                          <td>{p.phone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <h3>Historial de días</h3>
                <table border="1" cellPadding="5" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyEntries.length === 0 ? (
                      <tr><td colSpan="3">Aún no hay historial</td></tr>
                    ) : (
                      historyEntries.map(h => (
                        <tr key={h.id}>
                          <td>{h.id}</td>
                          <td>{h.date}</td>
                          <td>
                            <button onClick={() => { setHistoryDate(h.date); handleViewHistoryByDate(); }}>Ver</button>
                            <button onClick={() => handleDeleteHistory(h.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              
            </div>
          )}

          {activeSection === "historia" && (
            <div>
              <h2>Historia Clínica</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newRecord.patient_id || !newRecord.date || !newRecord.description) return;
                const added = await createMedicalRecord(newRecord);
                if (added) {
                  setMedicalRecords([added, ...medicalRecords]);
                  setNewRecord({ patient_id: newRecord.patient_id, date: "", description: "" });
                }
              }} style={{ marginBottom: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <select value={newRecord.patient_id} onChange={(e) => setNewRecord({ ...newRecord, patient_id: e.target.value })}>
                  <option value="">Selecciona paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} />
                <input placeholder="Descripción" value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} />
                <button type="submit">Agregar Registro</button>
              </form>
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {medicalRecords.length > 0 ? (
                    medicalRecords.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{patients.find(p => p.id === r.patient_id)?.name || r.patient_id}</td>
                        <td>{r.description}</td>
                        <td>{r.date}</td>
                        <td><button onClick={async () => { if (!confirm(`¿Eliminar registro de ${patients.find(p => p.id === r.patient_id)?.name || r.patient_id} (${r.date})?`)) return; const ok = await deleteMedicalRecord(r.id); if (ok) setMedicalRecords(medicalRecords.filter(x => x.id !== r.id)); }}>Eliminar</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No hay registros de historia clínica</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "facturacion" && (
            <div>
              <h2>Facturación</h2>
              <form onSubmit={handleAddInvoice} style={{ marginBottom: "10px" }}>
                <select value={newInvoice.patient_id} onChange={(e) => setNewInvoice({ ...newInvoice, patient_id: e.target.value })}>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input placeholder="Descripción" value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} />
                <input type="number" placeholder="Monto" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} />
                <button type="submit">Agregar Factura</button>
              </form>
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{patients.find(p => p.id === inv.patient_id)?.name || inv.patient_id}</td>
                      <td>{inv.description}</td>
                      <td>{inv.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "puntos" && (
            <div>
              <h2>Puntos Acumulados</h2>
              <form onSubmit={handleAddPoints} style={{ marginBottom: "10px" }}>
                <select value={newPoint.patient_id} onChange={(e) => setNewPoint({ ...newPoint, patient_id: e.target.value })}>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input type="number" placeholder="Puntos" value={newPoint.points} onChange={(e) => setNewPoint({ ...newPoint, points: e.target.value })} />
                <button type="submit">Agregar Puntos</button>
              </form>
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Puntos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map(pt => (
                    <tr key={pt.id}>
                      <td>{pt.id}</td>
                      <td>{patients.find(p => p.id === pt.patient_id)?.name || pt.patient_id}</td>
                      <td>{pt.points}</td>
                      <td><button onClick={() => handleDeletePoint(pt.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "inventario" && <Inventory />} {/* ✅ Aquí cargamos el componente real */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
