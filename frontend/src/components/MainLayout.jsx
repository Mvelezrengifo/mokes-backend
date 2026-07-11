import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import AuraWidget from './AuraWidget';  // ✅ Importación al inicio

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div style={styles.page}>
            <Header toggleSidebar={toggleSidebar} />

            <div style={styles.wrapper}>
                <main style={styles.mainContent}>
                    <Outlet />
                </main>
            </div>

            <footer style={styles.footer}>
                Diseñado por <strong>MokeSoft</strong>
            </footer>

            <AuraWidget />  {/* ✅ Componente dentro del JSX */}
        </div>
    );
}

const styles = {
    page: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#e6f0fa",
    },
    wrapper: {
        display: "flex",
        flex: 1,
    },
    mainContent: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f4f6f8",
    },
    footer: {
        textAlign: "center",
        padding: "10px",
        fontSize: "12px",
        color: "#666",
        borderTop: "1px solid #ddd",
        backgroundColor: "#fff",
    },
};