import { Link, useLocation } from "react-router-dom";

const BottomBarMobile = () => {
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
    if (itemPath === "/forecast/basic") {
      return location.pathname.startsWith("/forecast/basic");
    }
    if (itemPath === "/forecast/advanced") {
      return location.pathname.startsWith("/forecast/advanced");
    }
    return location.pathname === itemPath;
  };

  return (
    <div
      className="d-md-none fixed-bottom"
      style={{
        zIndex: 3000,
        padding: "0 18px 18px 18px",
      }}>
      {/* Floating Glass Container */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "22px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          boxShadow: "0 6px 25px rgba(0,0,0,0.12)",
          border: "1px solid rgba(255,255,255,0.4)",
        }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className="text-decoration-none"
              style={{ width: "33%", textAlign: "center" }}>
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{
                  padding: "6px 10px",
                  transition: "0.25s",
                  borderRadius: "14px",
                  background: active ? "rgba(59,130,246,0.25)" : "transparent",
                  boxShadow: active ? "0 0 12px rgba(59,130,246,0.5)" : "none",
                }}>
                <i
                  className={`${
                    item.icon.startsWith("icon-")
                      ? item.icon
                      : `fas ${item.icon}`
                  }`}
                  style={{
                    fontSize: "22px",
                    transition: "0.3s",
                    transform: active ? "translateY(-5px)" : "translateY(0)",
                    color: active ? "#2563eb" : "#6b7280",
                  }}></i>

                <span
                  style={{
                    fontSize: "12px",
                    marginTop: "3px",
                    fontWeight: active ? "600" : "500",
                    color: active ? "#2563eb" : "#6b7280",
                    transition: "0.25s",
                  }}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomBarMobile;
