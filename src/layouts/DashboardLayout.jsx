import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import StatsCards from "../components/StatsCards";
import MapView from "../components/MapView";

const DashboardLayout = () => {
  const [filters, setFilters] = useState({
    types: { Trash: true, Recycling: true, "Heavy Trash": true },
    vehicles: [],
    showStartEnd: true,
    showLabels: true,
    selectedDate: null,
    routeColors: [],
    addressSearch: ""
  });

  const location = useLocation();

  return (
    <div className="app-root">
      <Header
        onSearchAddress={(q) =>
          setFilters((s) => ({ ...s, addressSearch: q }))
        }
      />
      <div className="main-row">
        <div className="main-col">
          {/* Live View */}
          {location.pathname === "/" && (
            <>
              <StatsCards />
              <MapView filters={filters} />
            </>
          )}

          {/* Historical or Settings */}
          {location.pathname !== "/" && <Outlet />}
        </div>

        <Sidebar filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};

export default DashboardLayout;
