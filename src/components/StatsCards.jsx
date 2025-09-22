import React from "react";
import vehicles from "../data/vehicles.json";
import { FiTruck, FiWifi, FiCalendar, FiMap } from "react-icons/fi";

import "../styles/StatsCards.css"

export default function StatsCards() {
  const total = vehicles.length;
  const online = vehicles.filter((v) => v.online).length;
  const activeRoutes = 3; // static demo

  const stats = [
    { title: "Total Vehicles", value: total, icon: <FiTruck />, color: "#3b82f6" },
    { title: "Online", value: online, icon: <FiWifi />, color: "#22c55e" },
    { title: "Selected Date", value: "Today", icon: <FiCalendar />, color: "#f59e0b" },
    { title: "Active Routes", value: activeRoutes, icon: <FiMap />, color: "#8b5cf6" }
  ];

  return (
    <section className="stats-cards">
      {stats.map((s, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-icon" style={{ background: s.color + "22", color: s.color }}>
            {s.icon}
          </div>
          <div className="stat-info">
            <div className="stat-title">{s.title}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
