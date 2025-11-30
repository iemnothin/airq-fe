import Navigation from "../components/Navigation";
import { Outlet, Link } from "react-router-dom";

const ContainerPage = () => {
  return (
    <div className="d-flex">
      <div className="mobile-top-logo-bar d-block d-md-none text-center">
        <Link to="/" className="h-4 nav-item text-center mb-4 fw-bold text-decoration-none">
          <img
            src={process.env.PUBLIC_URL + "/air-no-outline192.png"}
            alt="AirQ Logo"
          />
          <div className="logo-text">AirQ</div>
        </Link>
      </div>

      <Navigation className="flex-shrink-0" />

      <div className="flex-grow-1 container-fluid p-0">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ContainerPage;
