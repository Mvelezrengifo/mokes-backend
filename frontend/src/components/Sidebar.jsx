import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar(){
  return (
    <aside className="sidebar">
      <h3>MOKES CLINIC</h3>
      <nav>
        <ul>
          <li><NavLink to="/dashboard" end>Inicio</NavLink></li>
          <li><NavLink to="/dashboard/pacientes">Pacientes</NavLink></li>
          <li><NavLink to="/dashboard/nueva">Nuevo paciente</NavLink></li>
        </ul>
      </nav>
    </aside>
  )
}
