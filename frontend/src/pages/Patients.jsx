// frontend/src/pages/Patients.jsx
import React, { useEffect, useState } from "react";
import { getPatients, createPatient } from "../services/patientsService";

function Patients() {
    const [patients, setPatients] = useState([]);
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const data = await getPatients();
        setPatients(data);
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!name || !document) return;

        const newPatient = await createPatient({ name, document, email, phone });
        if (newPatient) {
            setPatients([...patients, newPatient]);
            setName("");
            setDocument("");
            setEmail("");
            setPhone("");
        }
    };

    // ===============================
    // IMPORTAR EXCEL
    // ===============================
    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://localhost:3001/patients/import-excel", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!data.success) {
                alert("Error al importar Excel");
            } else {
                setImportResult(data);
                // Refresca automáticamente la lista de pacientes
                fetchPatients();
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al importar Excel");
        } finally {
            setImporting(false);
            e.target.value = "";
        }
    };

    return (
        <div>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Pacientes</h1>

                <label style={{ cursor: "pointer" }}>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelImport}
                        style={{ display: "none" }}
                    />
                    <span
                        style={{
                            padding: "8px 14px",
                            backgroundColor: "#2c7be5",
                            color: "#fff",
                            borderRadius: "6px",
                            fontSize: "14px",
                        }}
                    >
                        {importing ? "Importando..." : "Importar Excel"}
                    </span>
                </label>
            </div>

            {/* RESULTADO IMPORT */}
            {importResult && (
                <div style={{ margin: "10px 0", padding: "10px", background: "#f4f6f8", borderRadius: "6px" }}>
                    <strong>Resultado de importación:</strong>
                    <div>Filas procesadas: {importResult.processed}</div>
                    <div>Pacientes actualizados: {importResult.updated}</div>
                    {importResult.errors && importResult.errors.length > 0 && (
                        <details>
                            <summary>Errores ({importResult.errors.length})</summary>
                            <ul>
                                {importResult.errors.map((e, i) => (
                                    <li key={i}>
                                        Fila {e.row}: {e.message}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            )}

            {/* FORM PACIENTE */}
            <form onSubmit={handleAddPatient} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                    placeholder="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    placeholder="Número de Documento"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    required
                />
                <input
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    placeholder="Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                <button type="submit" style={{ backgroundColor: "#2c7be5", color: "#fff", border: "none", padding: "10px", borderRadius: "6px" }}>
                    Agregar Paciente
                </button>
            </form>

            {/* LISTA PACIENTES + PUNTOS */}
            <ul style={{ marginTop: "15px", listStyle: "none", padding: 0 }}>
                {patients.map((p) => (
                    <li key={p.id} style={{ padding: "10px", borderBottom: "1px solid #e0e0e0" }}>
                        <div>
                            <strong>{p.name}</strong> - {p.document} {p.email && `- ${p.email}`} {p.phone && `- ${p.phone}`}
                        </div>
                        <div>Puntos acumulados: {p.total_points ?? 0}</div>
                        {p.history && p.history.length > 0 && (
                            <details>
                                <summary>Historial ({p.history.length})</summary>
                                <ul>
                                    {p.history.map((h, i) => (
                                        <li key={i}>
                                            {h.date}: {h.note} ({h.points} puntos)
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Patients;
