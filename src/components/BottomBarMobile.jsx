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
        justifyContent: "space-around", // ▶ SEBAR RATA BALANCE
        padding: "0 10px",
      }}>
      {menuItems.map((item) => {
        const active = isActive(item.path);

        return (
          <Link
            key={item.name}
            to={item.path}
            className="text-decoration-none d-flex justify-content-center flex-grow-1"
            style={{ textAlign: "center" }}>
            <div
              className={`d-flex flex-column align-items-center justify-content-center bottom-bubble ${
                active ? "active" : ""
              }`}
              style={{
                padding: "6px 14px",
                borderRadius: "14px",
                transition: "0.25s",
                backgroundColor: active
                  ? "rgba(59,130,246,0.18)"
                  : "transparent", // ▶ BUBBLE BIRU
              }}>
              <i
                className={`${
                  item.icon.startsWith("icon-") ? item.icon : `fas ${item.icon}`
                }`}
                style={{
                  fontSize: "20px",
                  transition: "0.25s",
                  transform: active ? "translateY(-4px)" : "translateY(0px)",
                  color: active ? "#3b82f6" : "#6c757d",
                }}></i>

              <span
                style={{
                  fontSize: "12px",
                  marginTop: "2px",
                  transition: "0.25s",
                  color: active ? "#3b82f6" : "#6c757d",
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
