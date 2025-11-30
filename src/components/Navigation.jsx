import { useState } from "react";
import SidebarDesktop from "./SidebarDesktop";
import SidebarResponsive from "./SidebarResponsive";
import BottomBarMobile from "./BottomBarMobile";

const Navigation = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <>
      <div className="d-none d-xl-block">
        <SidebarDesktop />
      </div>

      <SidebarResponsive
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <button
        className="btn btn-primary d-none d-md-block d-xl-none position-fixed"
        style={{
          top: "12px",
          left: "12px",
          zIndex: 1050,
          borderRadius: "10px",
        }}
        onClick={() => setShowSidebar(!showSidebar)}>
        <i className={`fas ${showSidebar ? "fa-times" : "fa-bars"}`}></i>
      </button>

      <div className="mobile-bottom-wrapper d-block d-md-none text-center">
        <BottomBarMobile />
      </div>
    </>
  );
};

export default Navigation;
