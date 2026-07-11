import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from "../services/appointmentsService";
import { getPatients } from "../services/patientsService";

const SERVICIOS_BACKUP = [
    "Limpieza Facial Profunda", "Masaje Relajante", "Depilación Láser E-LIGHT",
    "Depilación Láser Diodo", "Tratamiento de Acné", "Rejuvenecimiento Facial",
    "Peeling Químico", "Modelación Corporal No Invasiva", "Presoterapia Profesional"
];

export default function Appointments() {
    const queryClient = useQueryClient();
    const [newService, setNewService] = useState("");
    const [form, setForm] = useState({ patient_id: "", date: "", time: "", treatment: "", notes: "" });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5175";

    // --- QUERIES ---
    const { data: patients = [] } = useQuery({
        queryKey: ['patients'],
        queryFn: getPatients,
        staleTime: 5 * 60 * 1000,
    });

    const { data: appointments = [] } = useQuery({
        queryKey: ['appointments'],
        queryFn: getAppointments,
        staleTime: 5000,
        select: (data) => {
            const today = new Date();
            today.setHours(0,0,0,0);
            return data.filter(a => {
                const d = new Date(a.date);
                d.setHours(0,0,0,0);
                return d.getTime() === today.getTime();
            });
        }
    });

    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/clinic-services`);
                const data = await res.json();
                if (data.success && data.services.length > 0) {
                    return data.services;
                }
                return SERVICIOS_BACKUP.map(name => ({ id: name, name }));
            } catch {
                return SERVICIOS_BACKUP.map(name => ({ id: name, name }));
            }
        },
        staleTime: 60 * 60 * 1000,
    });

    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries(['appointments']);
            setForm({ patient_id: "", date: "", time: "", treatment: "", notes: "" });
        },
        onError: (error) => alert(`Error: ${error.message}`),
    });

    const cancelMutation = useMutation({
        mutationFn: ({ id, status }) => updateAppointmentStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries(['appointments']),
        onError: (error) => alert(`Error al cancelar: ${error.message}`),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAppointment,
        onSuccess: () => queryClient.invalidateQueries(['appointments']),
        onError: (error) => alert(`Error al eliminar: ${error.message}`),
    });

    // --- HANDLERS ---
    const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.patient_id) return alert("Selecciona un paciente");
        if (!form.treatment) return alert("Selecciona un tratamiento");
        createMutation.mutate(form);
    };

    const handleAddCustomService = async () => {
        if (!newService.trim()) return;
        try {
            const res = await fetch(`${API_URL}/clinic-services`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({name: newService.trim()})
            });
            const data = await res.json();
            if (data.success) {
                setForm({...form, treatment: newService.trim()});
                setNewService("");
                queryClient.invalidateQueries(['services']);
            }
        } catch (err) {
            console.error("Error guardando servicio:", err);
            setForm({...form, treatment: newService.trim()});
            setNewService("");
        }
    };

    const handleCancel = (id) => {
        if (!confirm("¿Cancelar esta cita?")) return;
        cancelMutation.mutate({ id, status: 'cancelled' });
    };

    const handleDelete = (id) => {
        if (!confirm("¿Eliminar permanentemente?")) return;
        deleteMutation.mutate(id);
    };

    // --- ESTILOS (puedes adaptarlos a tu tema) ---
    const inputStyle = {padding: "8px", borderRadius: "5px", border: "1px solid #ddd", background: "#fff"};
    const btnPrimary = {backgroundColor: "#1e3a8a", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer"};
    const btnSuccess = {backgroundColor: "#22c55e", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer"};
    const btnDanger = {color: "#ef4444", border: "1px solid #ef4444", background: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer"};

    return (
        <div className="content" style={{padding: "20px"}}>
            <h2 style={{color: "#1e3a8a"}}>📅 Gestión de Citas</h2>

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{display: "flex", gap: "10px", flexWrap: "wrap", backgroundColor: "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"}}>
                <select name="patient_id" value={form.patient_id} onChange={handleChange} required style={inputStyle}>
                    <option value="">👤 Paciente</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                    <select name="treatment" value={form.treatment} onChange={handleChange} required style={{...inputStyle, minWidth: "200px"}}>
                        <option value="">✨ Servicio</option>
                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <input type="text" placeholder="Nuevo..." value={newService} onChange={(e) => setNewService(e.target.value)} style={{...inputStyle, width: "120px"}} />
                    <button type="button" onClick={handleAddCustomService} disabled={!newService.trim()} style={{...btnSuccess, opacity: !newService.trim() ? 0.6 : 1}}>+</button>
                </div>

                <input type="date" name="date" value={form.date} onChange={handleChange} required style={inputStyle} />
                <input type="time" name="time" value={form.time} onChange={handleChange} required style={inputStyle} />
                <input type="text" name="notes" placeholder="📝 Notas adicionales" value={form.notes} onChange={handleChange} style={{...inputStyle, width: "100%"}} />

                <button type="submit" disabled={createMutation.isPending} style={btnPrimary}>
                    {createMutation.isPending ? "⏳" : "✅ Agendar Cita"}
                </button>
            </form>

            {/* Lista de citas de hoy */}
            <h3>Agenda para Hoy</h3>
            {appointments.length === 0 ? (
                <p style={{color: "#666"}}>Sin citas para hoy.</p>
            ) : (
                <div style={{display: "grid", gap: "10px"}}>
                    {appointments.map(a => {
                        const patient = patients.find(p => p.id === a.patient_id);
                        return (
                            <div key={a.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "white", borderLeft: "5px solid #1e3a8a", borderRadius: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"}}>
                                <div>
                                    <strong style={{color: "#1e3a8a"}}>{a.time}</strong> - {patient?.name || "Desconocido"}
                                    <div style={{fontSize: "0.9em", color: "#666", marginTop: "4px"}}>
                                        🔹 <span style={{backgroundColor: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold"}}>{a.treatment}</span>
                                        {a.notes && <><br/><small style={{color: "#888"}}>📝 {a.notes}</small></>}
                                        {a.status === 'cancelled' && <span style={{color: "red", marginLeft: "8px"}}>❌ Cancelada</span>}
                                    </div>
                                </div>
                                <div style={{display: "flex", gap: "8px"}}>
                                    {a.status !== 'cancelled' && (
                                        <button onClick={() => handleCancel(a.id)} disabled={cancelMutation.isPending} style={btnDanger}>Cancelar</button>
                                    )}
                                    <button onClick={() => handleDelete(a.id)} disabled={deleteMutation.isPending} style={{...btnDanger, borderColor: "#999", color: "#999"}}>🗑️</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}