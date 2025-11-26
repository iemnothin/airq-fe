import { Link, useLocation } from "react-router-dom";

const BottomBarMobile = () => {
  const location = useLocation();
  const isForecastPage = location.pathname.includes("/forecast/basic");

  const menuItems = [
    {
      name: "Dashboard",
      icon: "fa-chart-line",
      path: "/dashboard",
      type: "fa",
    },
    {
      name: "Model",
      icon: "icon-fa-fb-prophet",
      path: "/model",
      type: "custom",
    },
    { name: "ISPU", icon: "fa-wind", path: "/forecast/basic", type: "fa" },
  ];

  // if (isForecastPage) {
  //   menuItems.push({
  //     name: "Ispu",
  //     icon: "fa-wind",
  //     path: "/forecast/basic/:pol",
  //     type: "fa",
  //   });
  // }

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
              location.pathname === item.path ? "text-success" : "text-muted"
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
