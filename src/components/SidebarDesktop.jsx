import { Link, useLocation } from "react-router-dom";

const SidebarDesktop = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "fa-chart-line", path: "/dashboard" },
    { name: "Model", icon: "icon-fa-fb-prophet", path: "/model" },
    { name: "ISPU", icon: "fa-wind", path: "/forecast/results" },
  ];

  const isActive = (itemPath) => {
    if (itemPath === "/forecast/results") {
      return location.pathname.startsWith("/forecast/results");
    }
    return location.pathname === itemPath;
  };

  return (
    <div
      className="sidebar-desktop d-none d-md-flex flex-column vh-100 p-3 bg-light border-end"
      style={{ width: "220px", position: "fixed" }}>
      <Link
        to="/"
        className="h-4 nav-item text-center mb-4 fw-bold text-decoration-none d-flex flex-column align-items-center">
        <img
          src={process.env.PUBLIC_URL + "/air-no-outline192.png"}
          alt="logo-AirQ"
          style={{ width: "60px", marginBottom: "10px" }}
        />
        <div className="text-primary">AirQ</div>
      </Link>

      <ul className="nav nav-pills flex-column mb-auto">
        {menuItems.map((item) => (
          <li className="nav-item mb-2" key={item.name}>
            <Link
              to={item.path}
              className={`nav-link d-flex align-items-center ${
                isActive(item.path)
                  ? "active bg-primary text-white"
                  : "text-dark"
              }`}>
              <i
                className={`${
                  item.icon.startsWith("icon-") ? item.icon : `fas ${item.icon}`
                } me-2`}
              />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto text-center small text-muted">
        <p>© 2025 AirQ</p>
      </div>
    </div>
  );
};

export default SidebarDesktop;
