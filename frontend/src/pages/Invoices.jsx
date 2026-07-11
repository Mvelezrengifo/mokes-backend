import React, { useEffect, useState } from "react";
import { getInvoices, deleteInvoice } from "../services/invoicesService";
import jsPDF from "jspdf";

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await getInvoices();
            // Si data es un array directo lo usa, si no, busca la propiedad .invoices
            const listaLimpia = Array.isArray(data) ? data : (data?.invoices || []);
            setInvoices(listaLimpia);
        } catch (err) {
            console.error("Error cargando facturas:", err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const toMoney = (n) => {
        const num = Number(n);
        return isNaN(num) ? "0.00" : num.toLocaleString('es-CO', { minimumFractionDigits: 2 });
    };

    // ✅ ESTA FUNCIÓN ES LA QUE ESTABA FALLANDO: Ahora es "Dura"
    const handleDownloadPDF = (inv) => {
    // 1. Extraemos los datos con valores por defecto reales
    const id = inv.id || "000";
    const fecha = inv.date || new Date().toLocaleDateString();
    const nombre = inv.patient_name || "Consumidor Final";
    const docum = inv.patient_document || "No registra";

    // Forzamos que el total sea un número, si falla ponemos 0
    const totalRaw = inv.total !== undefined ? inv.total : 0;
    const totalNum = Number(totalRaw);

    const desc = inv.description || "Servicio Médico/Estético";

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // --- DISEÑO ---
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(22);
    doc.text("MokesClinic & Spa", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Excelencia en Salud y Bienestar", 15, 26);

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Factura N°: ${id}`, 15, 40);
    doc.text(`Fecha: ${fecha}`, 140, 40);
    doc.text(`Paciente: ${nombre}`, 15, 48);
    doc.text(`Documento: ${docum}`, 15, 56);

    // Tabla
    doc.setFillColor(30, 58, 138);
    doc.rect(15, 65, 180, 8, "F");
    doc.setTextColor(255);
    doc.text("Descripción", 20, 70);
    doc.text("Total", 170, 70, { align: "right" });

    doc.setTextColor(0);
    doc.text(desc, 20, 80);

    // Aquí usamos toMoney que ya tienes, pero sobre totalNum
    doc.text(`$${toMoney(totalNum)}`, 170, 80, { align: "right" });

    doc.line(15, 85, 195, 85);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: $${toMoney(totalNum)}`, 170, 95, { align: "right" });

    doc.save(`Factura_Mokes_${id}.pdf`);
};

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar factura?")) return;
        const ok = await deleteInvoice(id);
        if (ok) fetchInvoices();
    };

    return (
        <div style={{ padding: "30px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
            <h2 style={{ color: "#1e3a8a", borderBottom: "2px solid #1e3a8a" }}>Historial de Facturación</h2>
            {loading ? <p>Cargando datos...</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", backgroundColor: "white" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#1e3a8a", color: "white" }}>
                            <th style={{ padding: "12px" }}>ID</th>
                            <th>Paciente</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                                <td style={{ padding: "12px" }}>{inv.id}</td>
                                <td>{inv.patient_name || "N/A"}</td>
                                <td>{inv.date}</td>
                                <td>${toMoney(inv.total)}</td>
                                <td style={{ padding: "10px" }}>
                                    <button onClick={() => handleDownloadPDF(inv)} style={{ cursor: "pointer" }}>📄 PDF</button>
                                    <button onClick={() => handleDelete(inv.id)} style={{ color: "red", marginLeft: "10px", cursor: "pointer" }}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}