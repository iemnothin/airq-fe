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
      className="d-md-none bg-light border-top fixed-bottom py-2 shadow-sm"
      style={{ zIndex: 1000 }}>
      <div className="d-flex justify-content-around">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`text-center text-decoration-none ${
              isActive(item.path) ? "text-success" : "text-muted"
            }`}>
            <i
              className={`${
                item.icon.startsWith("icon-") ? item.icon : `fas ${item.icon}`
              } fa-lg`}></i>
            <div style={{ fontSize: "12px" }}>{item.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomBarMobile;
