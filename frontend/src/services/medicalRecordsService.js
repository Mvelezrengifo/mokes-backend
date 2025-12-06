const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getMedicalRecords() {
  try {
    const res = await fetch(`${API_URL}/medical-records`);
    const data = await res.json();
    return data.success && Array.isArray(data.records) ? data.records : [];
  } catch (err) {
    console.error("Error al obtener historia clínica:", err);
    return [];
  }
}

export async function getMedicalRecordsByPatient(patient_id) {
  try {
    const res = await fetch(`${API_URL}/medical-records/patient/${patient_id}`);
    const data = await res.json();
    return data.success && Array.isArray(data.records) ? data.records : [];
  } catch (err) {
    console.error("Error al obtener historia por paciente:", err);
    return [];
  }
}

export async function createMedicalRecord(payload) {
  try {
    const res = await fetch(`${API_URL}/medical-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.success ? data.record : null;
  } catch (err) {
    console.error("Error al crear registro clínico:", err);
    return null;
  }
}

export async function deleteMedicalRecord(id) {
  try {
    const res = await fetch(`${API_URL}/medical-records/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success || false;
  } catch (err) {
    console.error("Error al eliminar registro clínico:", err);
    return false;
  }
}
