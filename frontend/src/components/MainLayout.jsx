// frontend/src/components/MainLayout.jsx
import React, { useState } from "react";
import Header from "./Header";
import Patients from "../pages/Patients";
import Appointments from "../pages/Appointments";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("patients"); // "patients" o "appointments"
  const [patients, setPatients] = useState([]);

  const handlePatientsChange = (newPatients) => {
    setPatients(newPatients);
  };

  return (
    <div style={styles.container}>
      {/* Cabecera */}
      <Header />

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={activeTab === "patients" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("patients")}
        >
          Pacientes
        </button>
        <button
          style={activeTab === "appointments" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("appointments")}
        >
          Citas
        </button>
      </div>

      {/* Contenido en cuadros */}
      <div style={styles.content}>
        {activeTab === "patients" && (
          <div style={styles.card}>
            <h2>Pacientes</h2>
            <Patients onPatientsChange={handlePatientsChange} />
          </div>
        )}

        {activeTab === "appointments" && (
          <div style={styles.card}>
            <h2>Citas</h2>
            <Appointments patients={patients} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  tabContainer: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },
  tab: {
    padding: "10px 20px",
    margin: "0 5px",
    cursor: "pointer",
    backgroundColor: "#eee",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  activeTab: {
    padding: "10px 20px",
    margin: "0 5px",
    cursor: "pointer",
    backgroundColor: "#ddd",
    border: "2px solid #888",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  content: {
    marginTop: "20px",
  },
  card: {
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
    boxShadow: "1px 1px 5px rgba(0,0,0,0.1)",
  },
};
