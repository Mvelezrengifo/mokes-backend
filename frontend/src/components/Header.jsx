// src/components/Header.jsx
import React from "react";

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <img src="/logo.png" alt="The One Medical Spa" style={styles.logo} />
        <h1 style={styles.title}>The One Medical Spa</h1>
      </div>
      {/* Opcional: aquí podrías agregar versión o nombre de sistema */}
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 20px",
    backgroundColor: "#f7f7f7",
    borderBottom: "2px solid #ddd",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "50px",
    width: "50px",
    marginRight: "15px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
  },
};
