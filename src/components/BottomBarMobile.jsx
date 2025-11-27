import { Link, useLocation } from "react-router-dom";

const BottomBarMobile = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "fa-chart-line", path: "/dashboard" },
    { name: "Model", icon: "icon-fa-fb-prophet", path: "/model" },
    { name: "ISPU", icon: "fa-wind", path: "/forecast/basic" },
  ];

  const isActive = (itemPath) => {
    if (itemPath === "/forecast/basic") {
      return location.pathname.startsWith("/forecast/basic");
    }
    return location.pathname === itemPath;
  };

  return (
    <div
      className="d-md-none fixed-bottom border-top bg-white shadow-sm"
      style={{
        height: "65px",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
      }}>
      {menuItems.map((item) => {
        const active = isActive(item.path);

        return (
          <Link
            key={item.name}
            to={item.path}
            className="text-decoration-none flex-grow-1 d-flex justify-content-center">
            <div
              className={`d-flex flex-column align-items-center px-3 py-1 bottom-bubble ${
                active ? "active" : ""
              }`}>
              <i
                className={`${
                  item.icon.startsWith("icon-") ? item.icon : `fas ${item.icon}`
                }`}
                style={{
                  fontSize: "20px",
                  transition: "0.25s",
                  transform: active ? "translateY(-4px)" : "translateY(0px)",
                }}></i>

              <span
                style={{
                  fontSize: "12px",
                  marginTop: "1px",
                  transition: "0.2s",
                  color: active ? "#198754" : "#6c757d",
                }}>
                {item.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomBarMobile;
