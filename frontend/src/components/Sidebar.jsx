import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ sidebarOpen }) {
    return (
        <nav style={{ ...styles.sidebar, width: sidebarOpen ? 220 : 60 }}>
            <NavLink to="/" style={styles.link} end>
                🏠 Inicio
            </NavLink>
            <NavLink to="/patients" style={styles.link}>
                🧑‍⚕️ Pacientes
            </NavLink>
            <NavLink to="/appointments" style={styles.link}>
                📅 Citas
            </NavLink>
            <NavLink to="/invoices" style={styles.link}>
                💳 Facturas
            </NavLink>
            <NavLink to="/inventory" style={styles.link}>
                📦 Inventario
            </NavLink>
        </nav>
    );
}

const styles = {
    sidebar: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e3a8a",
        color: "#fff",
        paddingTop: 20,
        transition: "width 0.3s",
    },
    link: {
        padding: "12px 20px",
        color: "#fff",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: 14,
    },
};
