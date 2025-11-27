// src/pages/ContainerPage.jsx
import { Link, Outlet } from "react-router-dom";
import Navigation from "../components/Navigation";

const MOBILE_LOGO = process.env.PUBLIC_URL + "/air-no-outline192.png";

const MobileTopLogoBar = () => (
  <div className="mobile-top-logo-bar d-block d-md-none text-center py-2">
    <Link
      to="/"
      className="nav-item fw-bold text-decoration-none d-flex flex-column align-items-center">
      <img src={MOBILE_LOGO} alt="AirQ Logo" style={{ width: "55px" }} />
      <div className="logo-text">AirQ</div>
    </Link>
  </div>
);

const ContainerPage = () => {
  return (
    <div className="d-flex">
      {/* MOBILE LOGO BAR */}
      <MobileTopLogoBar />

      {/* SIDEBAR */}
      <Navigation className="flex-shrink-0" />

      {/* MAIN PAGE CONTENT */}
      <main className="flex-grow-1 container-fluid p-0">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ContainerPage;
