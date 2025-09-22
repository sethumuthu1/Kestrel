import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  FiBell,
  FiSun,
  FiMoon,
  FiSearch,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiAlertCircle,
  FiMapPin,
  FiTruck,
} from "react-icons/fi";

import "../styles/Header.css";

export default function Header({ onSearchAddress }) {
  const [address, setAddress] = useState("");
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", dark);
  }, [dark]);

  // close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    onSearchAddress && onSearchAddress(address);
  };

  // Example notifications
  const notifications = [
    { id: 1, icon: <FiTruck />, text: "Vehicle 24 went offline", time: "2m ago" },
    { id: 2, icon: <FiMapPin />, text: "New route created", time: "15m ago" },
    { id: 3, icon: <FiAlertCircle />, text: "System maintenance at 10 PM", time: "1h ago" },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="header-main">
        {/* Logo & App Name */}
        <div className="header-left">
          <img src="/logo.png" alt="logo" className="logo" />
          {/* <h1 className="brand">Kestrel</h1> */}
        </div>

        {/* Search */}
        <form className="header-search" onSubmit={submitSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search address, vehicle, or route..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </form>

        {/* Right actions */}
        <div className="header-right">
          {/* Notifications */}
          <div className="notif-wrapper" ref={notifRef}>
            <button
              className="icon-btn"
              title="Notifications"
              onClick={() => setNotifOpen((o) => !o)}
            >
              <FiBell />
              <span className="badge">{notifications.length}</span>
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">Notifications</div>
                <div className="notif-list">
                  {notifications.map((n) => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-icon">{n.icon}</div>
                      <div className="notif-content">
                        <span className="notif-text">{n.text}</span>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="notif-clear"
                  onClick={() => alert("All notifications cleared")}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            className="icon-btn"
            onClick={() => setDark((d) => !d)}
            title="Toggle Theme"
          >
            {dark ? <FiMoon /> : <FiSun />}
          </button>

          {/* Profile */}
          <div
            className="profile"
            onClick={() => setProfileOpen((o) => !o)}
            ref={profileRef}
          >
            <div className="avatar">KS</div>
            <span className="profile-name">Admin</span>
            <FiChevronDown className="chevron" />

            {/* Dropdown menu */}
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-user">
                  <FiUser className="dropdown-icon" />
                  <div>
                    <div className="user-name">Kestrel Admin</div>
                    <div className="user-email">admin@kestrel.com</div>
                  </div>
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => alert("Signing out...")}
                >
                  <FiLogOut className="dropdown-icon" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Secondary nav (tabs) */}
      <nav className="sub-nav">
  <NavLink
    to="/"
    className={({ isActive }) => `sub-tab${isActive ? " active" : ""}`}
  >
    Live View
  </NavLink>

  <NavLink
    to="/historical"
    className={({ isActive }) => `sub-tab${isActive ? " active" : ""}`}
  >
    Historical
  </NavLink>

  <NavLink
    to="/settings"
    className={({ isActive }) => `sub-tab${isActive ? " active" : ""}`}
  >
    Settings
  </NavLink>
</nav>
    </>
  );
}
