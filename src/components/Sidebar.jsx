import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // ⬅️ icons
import vehicles from "../data/vehicles.json";
import routes from "../data/routes.json";
import "../styles/Sidebar.css"

export default function Sidebar({ filters, setFilters }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleType = (type) => {
    setFilters((s) => ({
      ...s,
      types: { ...s.types, [type]: !s.types[type] },
    }));
  };

  const toggleVehicle = (id) => {
    setFilters((s) => {
      const exists = s.vehicles.includes(id);
      return {
        ...s,
        vehicles: exists
          ? s.vehicles.filter((v) => v !== id)
          : [...s.vehicles, id],
      };
    });
    setDropdownOpen(false); // ✅ close after selecting
  };

  const toggleRouteColor = (color) => {
    setFilters((s) => {
      const exists = s.routeColors.includes(color);
      return {
        ...s,
        routeColors: exists
          ? s.routeColors.filter((c) => c !== color)
          : [...s.routeColors, color],
      };
    });
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Filters</h2>

      {/* Vehicle Types */}
      <div className="filter-card">
        <h3>Vehicle Types</h3>
        {Object.keys(filters.types).map((t) => (
          <label key={t} className="custom-checkbox">
            <input
              type="checkbox"
              checked={!!filters.types[t]}
              onChange={() => toggleType(t)}
            />
            <span className="checkmark"></span>
            {t}
          </label>
        ))}
      </div>

      {/* Vehicles with Dropdown + Chips */}
      <div className="filter-card">
        <h3>Vehicles</h3>

        {/* Selected chips */}
        <div className="chips-container">
          {filters.vehicles.map((id) => {
            const vehicle = vehicles.find((v) => v.id === id);
            return (
              <div key={id} className="chip">
                {vehicle?.name}
                <button
                  className="chip-close"
                  onClick={() => toggleVehicle(id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Dropdown */}
        <div
          className={`vehicle-dropdown ${dropdownOpen ? "open" : ""}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="dropdown-label">
            {filters.vehicles.length > 0
              ? `${filters.vehicles.length} selected`
              : "Select vehicles"}
          </div>
          <div className="dropdown-icon">
            {dropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </div>

        {dropdownOpen && (
          <div className="dropdown-list">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className={`dropdown-item ${
                  filters.vehicles.includes(v.id) ? "selected" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVehicle(v.id);
                }}
              >
                {v.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routes */}
      <div className="filter-card">
        <h3>Routes</h3>
        <div className="scroll-box">
          {routes.map((r) => (
            <label key={r.id} className="custom-checkbox small">
              <input
                type="checkbox"
                checked={filters.routeColors.includes(r.color)}
                onChange={() => toggleRouteColor(r.color)}
              />
              <span className="checkmark"></span>
              <span
                className="route-pill"
                style={{ background: r.color }}
              />
              Route {r.id}
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="filter-card">
        <h3>Options</h3>
        <label className="custom-checkbox small">
          <input
            type="checkbox"
            checked={filters.showStartEnd}
            onChange={() =>
              setFilters((s) => ({ ...s, showStartEnd: !s.showStartEnd }))
            }
          />
          <span className="checkmark"></span>
          Show start / end points
        </label>
        <label className="custom-checkbox small">
          <input
            type="checkbox"
            checked={filters.showLabels}
            onChange={() =>
              setFilters((s) => ({ ...s, showLabels: !s.showLabels }))
            }
          />
          <span className="checkmark"></span>
          Show vehicle labels
        </label>
      </div>

      {/* Date */}
      <div className="filter-card">
        <h3>Date</h3>
        <input
          type="date"
          value={filters.selectedDate || ""}
          onChange={(e) =>
            setFilters((s) => ({ ...s, selectedDate: e.target.value }))
          }
          className="styled-input"
        />
      </div>

      {/* Address Search */}
      <div className="filter-card">
        <h3>Address Search</h3>
        <div className="input-group">
          <input
            placeholder="e.g. 100 Main St"
            value={filters.addressSearch}
            onChange={(e) =>
              setFilters((s) => ({ ...s, addressSearch: e.target.value }))
            }
            className="styled-input"
          />
          <button
            className="styled-btn"
            onClick={() => setFilters((s) => ({ ...s }))}
          >
            Find
          </button>
        </div>
      </div>

      <p className="sidebar-tip">
        💡 Tip: Select vehicles from dropdown. Click × on top chips to remove.
      </p>
    </aside>
  );
}
