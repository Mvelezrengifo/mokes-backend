import React, { useEffect, useState } from "react";
import Inventory from "./Inventory";
import jsPDF from "jspdf";

// ⚙️ CONFIGURA TU PUERTO DEL BACKEND AQUÍ:
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

import {
    getPatients, createPatient, getPatientHistory, getPatientHistoryByDate,
    savePatientHistory, deletePatientHistory, deletePatient
} from "../services/patientsService";
import {
    getAppointments, createAppointment, cancelAppointment, deleteAppointment
} from "../services/appointmentsService";
import {
    getMedicalRecords, createMedicalRecord, deleteMedicalRecord
} from "../services/medicalRecordsService";
import {
    getPoints, createPoint, deletePoint
} from "../services/pointsService";

// ✅ Lista de servicios predefinidos
const SERVICIOS_CLINICA = [
    "Limpieza Facial Profunda", "Masaje Relajante", "Depilación Láser E-LIGHT",
    "Depilación Láser Diodo", "Tratamiento de Acné", "Rejuvenecimiento Facial",
    "Peeling Químico", "Modelación Corporal No Invasiva", "Presoterapia Profesional"
];

// 🎨 PALETA DE COLORES - The One Medical Spa Style
// Inspirado en: https://theonemedicalpty.com/
const COLORS = {
    // Verde médico suave (principal)
    primary: "#2d9b7d",        // Verde esmeralda profesional
    primaryLight: "#5fb8a3",   // Verde claro para hover
    primaryBg: "#e8f5f2",      // Fondo verde muy suave

    // Azul claro elegante (acentos)
    accent: "#6ca6cd",         // Azul cielo profesional
    accentLight: "#9bc4e6",    // Azul más claro

    // Neutros cálidos
    background: "#f9fbfa",     // Fondo principal (blanco con toque verde)
    card: "#ffffff",           // Tarjetas blancas
    border: "#d4e8e0",         // Bordes verde suave
    text: "#2c3e3a",           // Texto oscuro verde-gris
    textLight: "#5a6b67",      // Texto secundario
    textMuted: "#8a9b97",      // Texto desactivado

    // Estados
    success: "#2d9b7d",
    warning: "#f5a623",
    danger: "#e76f6f",

    // Header
    headerBg: "#2d9b7d",
    headerText: "#ffffff",
};

export default function Dashboard() {
    // ===== Estados =====
    const [patients, setPatients] = useState([]);
    const [newPatient, setNewPatient] = useState({ name: "", email: "", phone: "", age: "", document: "" });

    const [appointments, setAppointments] = useState([]);
    const [newAppointment, setNewAppointment] = useState({
        patient_id: "", date: "", time: "", notes: "", treatment: ""
    });

    const [medicalRecords, setMedicalRecords] = useState([]);
    const [newRecord, setNewRecord] = useState({ patient_id: "", date: "", description: "" });

    const [invoices, setInvoices] = useState([]);
    const [newInvoice, setNewInvoice] = useState({ patient_id: "", description: "", amount: "" });

    const [points, setPoints] = useState([]);
    const [newPoint, setNewPoint] = useState({ patient_id: "", points: "" });

    const [historyEntries, setHistoryEntries] = useState([]);
    const [historyPatients, setHistoryPatients] = useState([]);
    const [historyDate, setHistoryDate] = useState("");

    const [activeSection, setActiveSection] = useState("pacientes");
    const [showAllPatients, setShowAllPatients] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // ===== Fetch inicial =====
    useEffect(() => {
        fetchPatients(); fetchAppointments(); fetchMedicalRecords(); fetchPoints(); fetchHistory();
    }, []);

    const fetchPatients = async () => {
        const data = await getPatients(); setPatients(data);
        if (data.length > 0) {
            const firstId = data[0].id;
            setNewAppointment(prev => ({ ...prev, patient_id: firstId }));
            setNewInvoice(prev => ({ ...prev, patient_id: firstId }));
            setNewPoint(prev => ({ ...prev, patient_id: firstId }));
            setNewRecord(prev => ({ ...prev, patient_id: firstId }));
        }
    };
    const fetchAppointments = async () => { const data = await getAppointments(); setAppointments(data); };
    const fetchMedicalRecords = async () => { const data = await getMedicalRecords(); setMedicalRecords(data); };
    const fetchPoints = async () => { const data = await getPoints(); setPoints(data); };
    const fetchHistory = async () => { const data = await getPatientHistory(); setHistoryEntries(data); };

    // ===== Pacientes =====
    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!newPatient.name || !newPatient.age) return;
        const added = await createPatient(newPatient);
        if (added) {
            setPatients([...patients, added]);
            setNewPatient({ name: "", email: "", phone: "", age: "", document: "" });
            setNewAppointment(prev => ({ ...prev, patient_id: added.id }));
        }
    };
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

    // ===== Citas =====
    const handleAddAppointment = async (e) => {
        e.preventDefault();
        if (!newAppointment.patient_id || !newAppointment.date || !newAppointment.time) return;
        const added = await createAppointment(newAppointment);
        if (added) {
            setAppointments([...appointments, added]);
            setNewAppointment(prev => ({ ...prev, date: "", time: "", notes: "", treatment: "" }));
        }
    };
    const handleCancelAppointment = async (id) => {
        const a = appointments.find(x => x.id === id);
        const pname = patients.find(p => p.id === a?.patient_id)?.name || a?.patient_id || "";
        const when = a ? `${a.date} ${a.time}` : "";
        if (!confirm(`¿Cancelar cita de ${pname} (${when})?`)) return;
        const success = await cancelAppointment(id);
        if (success) await fetchAppointments();
    };
    const handleDeleteAppointment = async (id) => {
        const a = appointments.find(x => x.id === id);
        const pname = patients.find(p => p.id === a?.patient_id)?.name || a?.patient_id || "";
        const when = a ? `${a.date} ${a.time}` : "";
        if (!confirm(`¿Eliminar cita de ${pname} (${when})?`)) return;
        const success = await deleteAppointment(id);
        if (success) setAppointments(appointments.filter(a => a.id !== id));
    };

    // ✅ Manejar selección de tratamiento personalizado (última opción del dropdown)
    const handleTreatmentChange = (e) => {
        const value = e.target.value;
        if (value === "__CUSTOM__") {
            // Si selecciona "Agregar otro", mostrar prompt simple
            const custom = prompt("✍️ Escribe el nombre del servicio personalizado:");
            if (custom && custom.trim()) {
                setNewAppointment(prev => ({ ...prev, treatment: custom.trim() }));
            }
            // No cambiar el valor del select, dejarlo en blanco para próxima selección
        } else {
            setNewAppointment(prev => ({ ...prev, treatment: value }));
        }
    };

    // ✅ "El Puente": Conectar cita → facturación
    const handleActionInvoice = (cita) => {
        setActiveSection("facturacion");
        setNewInvoice({
            patient_id: cita.patient_id,
            description: cita.treatment || "Servicio Médico",
            amount: ""
        });
    };

    // ===== Historia clínica =====
    const handleAddRecord = async (e) => {
        e.preventDefault();
        if (!newRecord.patient_id || !newRecord.date || !newRecord.description) return;
        const added = await createMedicalRecord(newRecord);
        if (added) { setMedicalRecords([added, ...medicalRecords]); setNewRecord({ patient_id: newRecord.patient_id, date: "", description: "" }); }
    };
    const handleDeleteRecord = async (id) => {
        const rec = medicalRecords.find(r => r.id === id);
        if (!confirm(`¿Eliminar registro de ${rec?.description}?`)) return;
        const ok = await deleteMedicalRecord(id);
        if (ok) setMedicalRecords(medicalRecords.filter(r => r.id !== id));
    };

    // ===== Facturación =====
    const handleAddInvoice = async (e) => {
        e.preventDefault();
        if (!newInvoice.patient_id || !newInvoice.amount) return;
        try {
            const response = await fetch(`${API_URL}/invoices`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: newInvoice.patient_id,
                    date: new Date().toISOString().split("T")[0],
                    total: Number(newInvoice.amount) || 0,
                    description: newInvoice.description || "Servicio Médico"
                }),
            });
            const data = await response.json();
            if (data && data.success && data.invoice) {
                const addedInvoice = data.invoice;
                setInvoices([...invoices, addedInvoice]);
                setNewInvoice({ patient_id: newInvoice.patient_id, description: "", amount: "" });
                handleDownloadPDF(addedInvoice);
            } else { alert('Fallo al guardar la factura'); }
        } catch (error) { console.error("Error al crear factura:", error); alert("Fallo al guardar la factura"); }
    };
    const handleDeleteInvoice = (id) => { if (!confirm('¿Eliminar esta factura?')) return; setInvoices(invoices.filter(inv => inv.id !== id)); };

    // ✅ PDF PROFESIONAL - The One Medical Spa Style
    const handleDownloadPDF = async (inv) => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const patient = patients.find(p => p.id === inv.patient_id);
        const patientName = patient?.name || "Desconocido";
        const patientDoc = patient?.document || "No registra";

        // ✅ Datos con fallbacks ROBUSTOS para evitar undefined/NaN
        const invoiceId = (inv?.id !== undefined && inv?.id !== null) ? inv.id : "N/A";
        const invoiceDate = (inv?.date && inv.date.trim()) ? inv.date : new Date().toLocaleDateString();
        const totalValue = inv?.total ?? inv?.amount ?? 0;
        const total = typeof totalValue === 'number' && !isNaN(totalValue) ? totalValue : 0;
        const description = (inv?.description && inv.description.trim()) ? inv.description : "Servicio Médico";

        // 🎨 HEADER INSTITUCIONAL - The One Medical Spa
        // Fondo verde esmeralda suave
        doc.setFillColor(45, 155, 125); // #2d9b7d
        doc.rect(0, 0, 210, 60, 'F');

        // Nombre de la clínica - GRANDE y prominente
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("The One Medical Spa", 105, 25, { align: "center" });

        // Eslogan elegante
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Excelencia en Salud y Bienestar", 105, 35, { align: "center" });

        // Datos de contacto sutiles
        doc.setFontSize(9);
        doc.text("📍 Panamá | 📞 +507 123-4567 | ✉️ info@theonemedical.com", 105, 48, { align: "center" });

        // Separador elegante
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.line(20, 55, 190, 55);

        // 📋 DATOS DE LA FACTURA
        doc.setTextColor(44, 62, 58); // #2c3e3a
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Factura N°: ${invoiceId}`, 20, 72);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${invoiceDate}`, 140, 72, { align: "right" });

        // Cliente - tarjeta elegante
        doc.setFillColor(232, 245, 242); // #e8f5f2
        doc.roundedRect(20, 80, 170, 28, 3, 3, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(45, 155, 125);
        doc.text("PACIENTE", 25, 90);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(44, 62, 58);
        doc.text(`Nombre: ${patientName}`, 25, 100);
        doc.text(`Documento: ${patientDoc}`, 105, 100);

        // Ítems - tabla limpia
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(45, 155, 125);
        doc.roundedRect(20, 118, 170, 10, 2, 2, 'F');
        doc.text("Servicio", 25, 125);
        doc.text("Total", 165, 125, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(44, 62, 58);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, 128, 170, 18, 2, 2, 'F');
        doc.text(description, 25, 138);
        doc.text(`$${total.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 165, 138, { align: "right" });

        // 💰 TOTAL - destacado con estilo
        doc.setFillColor(45, 155, 125);
        doc.roundedRect(125, 160, 65, 16, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("TOTAL:", 130, 170);
        doc.text(`$${total.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 185, 170, { align: "right" });

        // 🦶 PIE DE PÁGINA
        doc.setFontSize(9);
        doc.setTextColor(138, 155, 151);
        doc.text("Gracias por confiar en The One Medical Spa", 105, 285, { align: "center" });
        doc.setFontSize(8);
        doc.text("Documento válido como comprobante de pago", 105, 290, { align: "center" });

        // Guardar con nombre limpio
        const safeName = (s) => (s || "Paciente").replace(/\s+/g, "_").replace(/[^\w_]/g, "");
        doc.save(`Factura_${invoiceId}_${safeName(patientName)}.pdf`);
    };

    // ===== Puntos =====
    const handleAddPoints = async (e) => {
        e.preventDefault();
        if (!newPoint.patient_id || !newPoint.points) return;
        const added = await createPoint({ patient_id: newPoint.patient_id, points: Number(newPoint.points) });
        if (added) { setPoints([added, ...points]); setNewPoint({ patient_id: newPoint.patient_id, points: "" }); }
    };
    const handleDeletePoint = async (id) => {
        const rec = points.find(x => x.id === id);
        if (!confirm(`¿Eliminar ${rec?.points} puntos?`)) return;
        const ok = await deletePoint(id); if (ok) setPoints(points.filter(p => p.id !== id));
    };

    // ===== Historial =====
    const handleSaveTodayHistory = async () => { const saved = await savePatientHistory(); if (saved) fetchHistory(); };
    const handleViewHistoryByDate = async () => { if (!historyDate) return; const snap = await getPatientHistoryByDate(historyDate); setHistoryPatients(snap?.patients || []); };
    const handleDeleteHistory = async (id) => { if (!confirm("¿Eliminar historial?")) return; const ok = await deletePatientHistory(id); if (ok) fetchHistory(); };

    // ===== Import Excel =====
    const handleExcelImport = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setImporting(true); setImportResult(null);
        try {
            const formData = new FormData(); formData.append("file", file);
            const res = await fetch(`${API_URL}/patients/import-excel`, { method: "POST", body: formData });
            const data = await res.json();
            if (!data.success) { alert("Error al importar Excel: " + (data.message || "Formato no válido")); }
            else { setImportResult(data); fetchPatients(); }
        } catch (err) { console.error("Error en importación:", err); alert("Error de conexión"); }
        finally { setImporting(false); e.target.value = ""; }
    };

    // ===== Estilos profesionales - The One Medical Spa =====
    const containerStyle = { display: "flex", minHeight: "100vh", backgroundColor: COLORS.background };
    const menuStyle = {
        width: "250px", padding: "24px", backgroundColor: COLORS.headerBg,
        borderRight: `1px solid ${COLORS.border}`, minHeight: "100vh",
        boxShadow: "2px 0 12px rgba(0,0,0,0.06)"
    };
    const contentStyle = {
        flex: 1, padding: "28px", backgroundColor: COLORS.background,
        borderRadius: "16px", margin: "16px", overflowY: "auto"
    };
    const buttonStyle = {
        display: "block", width: "100%", marginBottom: "10px",
        backgroundColor: "transparent", color: COLORS.headerText,
        border: `1px solid rgba(255,255,255,0.25)`, padding: "13px 16px",
        borderRadius: "10px", cursor: "pointer", fontSize: "14px",
        fontWeight: "500", textAlign: "left", transition: "all 0.2s ease"
    };
    const buttonActiveStyle = { ...buttonStyle, backgroundColor: "rgba(255,255,255,0.18)", border: `1px solid rgba(255,255,255,0.5)` };
    const treatmentBadgeStyle = {
        backgroundColor: COLORS.primaryBg, color: COLORS.primary, padding: "5px 14px",
        borderRadius: "20px", fontSize: "0.85em", fontWeight: "600",
        border: `1px solid ${COLORS.primaryLight}`, display: "inline-block"
    };
    const cardStyle = {
        backgroundColor: COLORS.card, padding: "24px", borderRadius: "14px",
        marginBottom: "20px", boxShadow: "0 4px 16px rgba(45, 155, 125, 0.08)",
        border: `1px solid ${COLORS.border}`
    };
    const inputStyle = {
        padding: "12px 14px", borderRadius: "10px", border: `1px solid ${COLORS.border}`,
        fontSize: "14px", backgroundColor: "#fff", transition: "border-color 0.2s",
        outline: "none"
    };
    const btnPrimary = {
        backgroundColor: COLORS.primary, color: "white", padding: "12px 26px",
        border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500",
        transition: "background-color 0.2s", fontSize: "14px"
    };
    const btnSuccess = {
        backgroundColor: COLORS.primary, color: "white", border: "none",
        padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "13px"
    };
    const btnDanger = {
        color: COLORS.danger, border: `1px solid ${COLORS.danger}`,
        background: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px"
    };

    const visiblePatients = showAllPatients ? patients : patients.slice(0, 4);

    // ===== Render =====
    return (
        <div style={containerStyle}>
            {/* Menú Lateral - The One Medical Spa */}
            <div style={menuStyle}>
                <div style={{ marginBottom: "32px", textAlign: "center", padding: "12px 0" }}>
                    {/* Logo textual elegante */}
                    <div style={{
                        fontSize: "20px", fontWeight: "700", color: "white",
                        marginBottom: "4px", letterSpacing: "-0.5px"
                    }}>The One</div>
                    <div style={{
                        fontSize: "11px", color: "rgba(255,255,255,0.85)",
                        fontWeight: "400", letterSpacing: "0.5px"
                    }}>Medical Spa</div>
                    <div style={{
                        height: "2px", width: "40px", backgroundColor: "rgba(255,255,255,0.4)",
                        margin: "12px auto", borderRadius: "1px"
                    }}></div>
                    <p style={{ color: "rgba(255,255,255,0.75)", margin: 0, fontSize: "11px" }}>Panel Administrativo</p>
                </div>

                <button style={activeSection === "pacientes" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("pacientes")}>👥 Pacientes</button>
                <button style={activeSection === "citas" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("citas")}>📅 Citas</button>
                <button style={activeSection === "historia" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("historia")}>🏥 Historia Clínica</button>
                <button style={activeSection === "facturacion" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("facturacion")}>💰 Facturación</button>
                <button style={activeSection === "puntos" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("puntos")}>⭐ Puntos</button>
                <button style={activeSection === "inventario" ? buttonActiveStyle : buttonStyle} onClick={() => setActiveSection("inventario")}>📦 Inventario</button>

                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid rgba(255,255,255,0.25)` }}>
                    <label style={{
                        ...buttonStyle, textAlign: "center", cursor: "pointer",
                        backgroundColor: "rgba(255,255,255,0.15)", border: "none"
                    }}>
                        {importing ? "⏳ Importando..." : "📁 Importar Excel"}
                        <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
                    </label>
                    {importResult && (
                        <div style={{
                            backgroundColor: "rgba(255,255,255,0.15)", padding: "12px",
                            borderRadius: "10px", marginTop: "12px", color: "white", fontSize: "12px"
                        }}>
                            ✅ <strong>Importación exitosa</strong><br />
                            Procesados: {importResult.processed}<br />
                            Actualizados: {importResult.updated}
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido Principal */}
            <div style={contentStyle}>
                {/* ========== SECCIÓN PACIENTES ========== */}
                {activeSection === "pacientes" && (
                    <div>
                        <h2 style={{ color: COLORS.text, marginBottom: "24px", fontSize: "22px", fontWeight: "600" }}>👥 Gestión de Pacientes</h2>
                        <form onSubmit={handleAddPatient} style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Agregar Nuevo Paciente</h3>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                                <input placeholder="Nombre completo" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} style={{ ...inputStyle, flex: "1", minWidth: "200px" }} required />
                                <input placeholder="N° Documento" value={newPatient.document} onChange={e => setNewPatient({ ...newPatient, document: e.target.value })} style={{ ...inputStyle, width: "160px" }} />
                                <input placeholder="Edad" type="number" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} style={{ ...inputStyle, width: "100px" }} required />
                                <input placeholder="Email" type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} style={{ ...inputStyle, flex: "1", minWidth: "200px" }} />
                                <input placeholder="Teléfono" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} style={{ ...inputStyle, flex: "1", minWidth: "200px" }} />
                            </div>
                            <button type="submit" style={btnPrimary}>➕ Agregar Paciente</button>
                        </form>
                        <div style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ margin: 0, color: COLORS.text }}>Lista de Pacientes ({patients.length})</h3>
                                {patients.length > 4 && (
                                    <button onClick={() => setShowAllPatients(!showAllPatients)} style={{
                                        padding: "8px 16px", backgroundColor: showAllPatients ? COLORS.textLight : COLORS.primary,
                                        color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                                    }}>{showAllPatients ? "Mostrar menos" : "Mostrar todos"}</button>
                                )}
                            </div>
                            {patients.length === 0 ? (<p style={{ textAlign: "center", color: COLORS.textMuted, padding: "24px" }}>No hay pacientes registrados.</p>) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>ID</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Nombre</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Documento</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Edad</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Email</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Teléfono</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Acciones</th>
                                    </tr></thead>
                                    <tbody>
                                        {visiblePatients.map(p => (<tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                            <td style={{ padding: "14px", color: COLORS.textMuted }}>{p.id}</td>
                                            <td style={{ padding: "14px", fontWeight: "500" }}>{p.name}</td>
                                            <td style={{ padding: "14px", fontFamily: "monospace", color: COLORS.textMuted }}>{p.document || "-"}</td>
                                            <td style={{ padding: "14px", color: COLORS.textMuted }}>{p.age}</td>
                                            <td style={{ padding: "14px", color: COLORS.textMuted }}>{p.email || "-"}</td>
                                            <td style={{ padding: "14px", color: COLORS.textMuted }}>{p.phone || "-"}</td>
                                            <td style={{ padding: "14px" }}><button onClick={() => handleDeletePatient(p.id)} style={btnDanger}>🗑️ Eliminar</button></td>
                                        </tr>))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {/* Historial diario */}
                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>📅 Historial por Día</h3>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                                <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} style={inputStyle} />
                                <button onClick={handleViewHistoryByDate} style={btnPrimary}>🔍 Ver Historial</button>
                                <button onClick={handleSaveTodayHistory} style={btnSuccess}>💾 Guardar Hoy</button>
                            </div>
                            {historyPatients.length > 0 && (<div style={{ marginTop: "16px" }}><h4 style={{ color: COLORS.text }}>Pacientes del día {historyDate}</h4>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                    <th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Nombre</th><th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Documento</th><th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Edad</th><th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Email</th>
                                </tr></thead><tbody>
                                    {historyPatients.map(p => (<tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "10px" }}>{p.name}</td><td style={{ padding: "10px", fontFamily: "monospace", color: COLORS.textMuted }}>{p.document || "-"}</td><td style={{ padding: "10px", color: COLORS.textMuted }}>{p.age}</td><td style={{ padding: "10px", color: COLORS.textMuted }}>{p.email || "-"}</td></tr>))}
                                </tbody></table></div>)}
                            <div style={{ marginTop: "20px" }}><h4 style={{ color: COLORS.text }}>Historial de Días Guardados</h4>
                                {historyEntries.length === 0 ? (<p style={{ color: COLORS.textMuted }}>No hay historial guardado.</p>) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                        <th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>ID</th><th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Fecha</th><th style={{ padding: "10px", textAlign: "left", color: COLORS.text }}>Acciones</th>
                                    </tr></thead><tbody>
                                        {historyEntries.map(h => (<tr key={h.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "10px", color: COLORS.textMuted }}>{h.id}</td><td style={{ padding: "10px", color: COLORS.textMuted }}>{h.date}</td>
                                            <td style={{ padding: "10px" }}><button onClick={() => { setHistoryDate(h.date); handleViewHistoryByDate(); }} style={{ ...btnPrimary, padding: "4px 12px", fontSize: "12px", marginRight: "6px" }}>Ver</button>
                                            <button onClick={() => handleDeleteHistory(h.id)} style={{ ...btnDanger, padding: "4px 12px", fontSize: "12px" }}>Eliminar</button></td>
                                        </tr>))}
                                    </tbody></table>)}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== SECCIÓN CITAS ✅ CON "+" AL FINAL DEL DROPDOWN ========== */}
                {activeSection === "citas" && (
                    <div>
                        <h2 style={{ color: COLORS.text, marginBottom: "24px", fontSize: "22px", fontWeight: "600" }}>📅 Gestión de Citas</h2>
                        <form onSubmit={handleAddAppointment} style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Agendar Nueva Cita</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Paciente *</label>
                                    <select value={newAppointment.patient_id} onChange={e => setNewAppointment({ ...newAppointment, patient_id: e.target.value })} style={{ ...inputStyle, width: "100%" }} required>
                                        <option value="">Seleccionar paciente</option>{patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Fecha *</label>
                                    <input type="date" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Hora *</label>
                                    <input type="time" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Tratamiento</label>
                                    {/* ✅ SELECT CON "+" COMO ÚLTIMA OPCIÓN */}
                                    <select
                                        value={newAppointment.treatment || ""}
                                        onChange={handleTreatmentChange}
                                        style={{ ...inputStyle, width: "100%" }}
                                    >
                                        <option value="">Seleccionar servicio</option>
                                        {SERVICIOS_CLINICA.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        {/* ✅ "+" AL FINAL DEL LISTADO */}
                                        <option value="__CUSTOM__" style={{ fontWeight: "600", color: COLORS.primary, borderTop: `1px dashed ${COLORS.border}`, marginTop: "8px", paddingTop: "8px" }}>
                                            ✨ Agregar otro servicio...
                                        </option>
                                    </select>
                                </div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Notas</label>
                                    <input placeholder="Observaciones" value={newAppointment.notes} onChange={e => setNewAppointment({ ...newAppointment, notes: e.target.value })} style={{ ...inputStyle, width: "100%" }} /></div>
                            </div>
                            <button type="submit" style={btnPrimary}>📅 Agendar Cita</button>
                        </form>

                        {/* Lista de citas */}
                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Citas Programadas ({appointments.length})</h3>
                            {appointments.length === 0 ? (<p style={{ textAlign: "center", color: COLORS.textMuted, padding: "24px" }}>No hay citas programadas.</p>) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>ID</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Paciente</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Fecha</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Hora</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Tratamiento</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Notas</th>
                                        <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Acciones</th>
                                    </tr></thead>
                                    <tbody>
                                        {appointments.map(a => {
                                            const patient = patients.find(p => p.id === a.patient_id);
                                            return (
                                                <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                                    <td style={{ padding: "14px", color: COLORS.textMuted }}>{a.id}</td>
                                                    <td style={{ padding: "14px", fontWeight: "500" }}>{patient ? patient.name : "Desconocido"}</td>
                                                    <td style={{ padding: "14px", color: COLORS.textMuted }}>{a.date}</td>
                                                    <td style={{ padding: "14px", fontWeight: "600", color: COLORS.primary }}>{a.time}</td>
                                                    <td style={{ padding: "14px" }}>
                                                        {a.treatment ? (<span style={treatmentBadgeStyle}>{a.treatment}</span>) : (<span style={{ color: COLORS.textMuted, fontSize: "0.9em" }}>—</span>)}
                                                    </td>
                                                    <td style={{ padding: "14px", fontSize: "0.9em", color: COLORS.textMuted }}>{a.notes || "-"}</td>
                                                    <td style={{ padding: "14px" }}>
                                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                            <button onClick={() => handleCancelAppointment(a.id)} style={{ ...btnDanger, backgroundColor: "transparent" }}>⚠️ Cancelar</button>
                                                            <button onClick={() => handleDeleteAppointment(a.id)} style={btnDanger}>🗑️ Eliminar</button>
                                                            <button onClick={() => handleActionInvoice(a)} style={btnSuccess}>🧾 Facturar</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== SECCIÓN HISTORIA CLÍNICA ========== */}
                {activeSection === "historia" && (
                    <div>
                        <h2 style={{ color: COLORS.text, marginBottom: "24px", fontSize: "22px", fontWeight: "600" }}>🏥 Historia Clínica</h2>
                        <form onSubmit={handleAddRecord} style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Nuevo Registro Clínico</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Paciente *</label>
                                    <select value={newRecord.patient_id} onChange={e => setNewRecord({ ...newRecord, patient_id: e.target.value })} style={{ ...inputStyle, width: "100%" }} required>
                                        <option value="">Seleccionar paciente</option>{patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Fecha *</label>
                                    <input type="date" value={newRecord.date} onChange={e => setNewRecord({ ...newRecord, date: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                                <div style={{ gridColumn: "span 2" }}><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Descripción *</label>
                                    <input placeholder="Diagnóstico, tratamiento..." value={newRecord.description} onChange={e => setNewRecord({ ...newRecord, description: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                            </div>
                            <button type="submit" style={btnPrimary}>📝 Agregar Registro</button>
                        </form>
                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Registros Clínicos ({medicalRecords.length})</h3>
                            {medicalRecords.length === 0 ? (<p style={{ textAlign: "center", color: COLORS.textMuted, padding: "24px" }}>No hay registros clínicos.</p>) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>ID</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Paciente</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Fecha</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Descripción</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Acciones</th>
                                </tr></thead><tbody>
                                    {medicalRecords.map(r => { const patient = patients.find(p => p.id === r.patient_id); return (
                                        <tr key={r.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "14px", color: COLORS.textMuted }}>{r.id}</td>
                                        <td style={{ padding: "14px", fontWeight: "500" }}>{patient ? patient.name : "Desconocido"}</td>
                                        <td style={{ padding: "14px", color: COLORS.textMuted }}>{r.date}</td><td style={{ padding: "14px" }}>{r.description}</td>
                                        <td style={{ padding: "14px" }}><button onClick={() => handleDeleteRecord(r.id)} style={btnDanger}>🗑️ Eliminar</button></td>
                                    </tr>); })}
                                </tbody></table>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== SECCIÓN FACTURACIÓN ========== */}
                {activeSection === "facturacion" && (
                    <div>
                        <h2 style={{ color: COLORS.text, marginBottom: "24px", fontSize: "22px", fontWeight: "600" }}>💰 Facturación</h2>
                        <form onSubmit={handleAddInvoice} style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Nueva Factura</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Paciente *</label>
                                    <select value={newInvoice.patient_id} onChange={e => setNewInvoice({ ...newInvoice, patient_id: e.target.value })} style={{ ...inputStyle, width: "100%" }} required>
                                        <option value="">Seleccionar paciente</option>{patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Descripción</label>
                                    <input placeholder="Servicio prestado" value={newInvoice.description} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} style={{ ...inputStyle, width: "100%" }} /></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Monto ($) *</label>
                                    <input type="number" placeholder="0.00" step="0.01" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                            </div>
                            <button type="submit" style={btnPrimary}>📄 Generar Factura</button>
                        </form>
                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Facturas ({invoices.length})</h3>
                            {invoices.length === 0 ? (<p style={{ textAlign: "center", color: COLORS.textMuted, padding: "24px" }}>No hay facturas registradas.</p>) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>ID</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Paciente</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Fecha</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Descripción</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Monto</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Acciones</th>
                                </tr></thead><tbody>
                                    {invoices.map(inv => { const patient = patients.find(p => p.id === inv.patient_id); return (
                                        <tr key={inv.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "14px", color: COLORS.textMuted }}>{inv.id}</td>
                                        <td style={{ padding: "14px", fontWeight: "500" }}>{patient ? patient.name : "Desconocido"}</td>
                                        <td style={{ padding: "14px", color: COLORS.textMuted }}>{inv.date}</td><td style={{ padding: "14px" }}>{inv.description || "-"}</td>
                                        <td style={{ padding: "14px", fontWeight: "bold", color: COLORS.primary }}>${Number(inv.total || inv.amount || 0).toFixed(2)}</td>
                                        <td style={{ padding: "14px" }}><div style={{ display: "flex", gap: "6px" }}>
                                            <button onClick={() => handleDownloadPDF(inv)} style={btnSuccess}>📥 PDF</button>
                                            <button onClick={() => handleDeleteInvoice(inv.id)} style={btnDanger}>🗑️ Eliminar</button>
                                        </div></td>
                                    </tr>); })}
                                </tbody></table>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== SECCIÓN PUNTOS ========== */}
                {activeSection === "puntos" && (
                    <div>
                        <h2 style={{ color: COLORS.text, marginBottom: "24px", fontSize: "22px", fontWeight: "600" }}>⭐ Sistema de Puntos</h2>
                        <form onSubmit={handleAddPoints} style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Asignar Puntos</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Paciente *</label>
                                    <select value={newPoint.patient_id} onChange={e => setNewPoint({ ...newPoint, patient_id: e.target.value })} style={{ ...inputStyle, width: "100%" }} required>
                                        <option value="">Seleccionar paciente</option>{patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select></div>
                                <div><label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: COLORS.text }}>Puntos *</label>
                                    <input type="number" placeholder="Ej: 100" value={newPoint.points} onChange={e => setNewPoint({ ...newPoint, points: e.target.value })} style={{ ...inputStyle, width: "100%" }} required /></div>
                            </div>
                            <button type="submit" style={btnPrimary}>⭐ Asignar Puntos</button>
                        </form>
                        <div style={cardStyle}>
                            <h3 style={{ marginTop: 0, color: COLORS.text }}>Puntos Asignados ({points.length})</h3>
                            {points.length === 0 ? (<p style={{ textAlign: "center", color: COLORS.textMuted, padding: "24px" }}>No hay puntos asignados.</p>) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ backgroundColor: COLORS.primaryBg }}>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>ID</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Paciente</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Documento</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Puntos</th>
                                    <th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Fecha</th><th style={{ padding: "14px", textAlign: "left", borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text }}>Acciones</th>
                                </tr></thead><tbody>
                                    {points.map(p => { const patient = patients.find(patient => patient.id === p.patient_id); return (
                                        <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "14px", color: COLORS.textMuted }}>{p.id}</td>
                                        <td style={{ padding: "14px", fontWeight: "500" }}>{patient ? patient.name : "Desconocido"}</td>
                                        <td style={{ padding: "14px", fontFamily: "monospace", color: COLORS.textMuted }}>{patient?.document || "-"}</td>
                                        <td style={{ padding: "14px", fontWeight: "bold", color: COLORS.warning }}>{p.points} pts</td>
                                        <td style={{ padding: "14px", color: COLORS.textMuted }}>{p.date || "-"}</td>
                                        <td style={{ padding: "14px" }}><button onClick={() => handleDeletePoint(p.id)} style={btnDanger}>🗑️ Eliminar</button></td>
                                    </tr>); })}
                                </tbody></table>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== SECCIÓN INVENTARIO ========== */}
                {activeSection === "inventario" && (<div><Inventory /></div>)}
            </div>
        </div>
    );
}
// ✅ NO AGREGAR NADA MÁS - YA TIENE EXPORT DEFAULT EN LA FUNCIÓN