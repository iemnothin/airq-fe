// src/pages/ContainerPage.jsx
import Navigation from "../components/Navigation";
import { Outlet } from "react-router-dom";

const ContainerPage = () => {
  return (
    <div className="d-flex">
      {/* Top Bar Logo khusus Mobile */}
      <div className="mobile-top-logo-bar d-block d-md-none text-center">
        <img
          src={process.env.PUBLIC_URL + "/air-no-outline192.png"}
          alt="AirQ Logo"
        />
        <div className="logo-text">AirQ</div>
      </div>

      {/* Sidebar Navigation */}
      <Navigation className="flex-shrink-0" />

      {/* Page Content */}
      <div className="flex-grow-1 container-fluid p-0">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ContainerPage;
