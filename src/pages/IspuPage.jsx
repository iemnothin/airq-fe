import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://api-airq.abiila.com/api/v1";

const pollutants = [
  { key: "pm10", label: "PM10" },
  { key: "pm25", label: "PM25" },
  { key: "so2", label: "SO₂" },
  { key: "co", label: "CO" },
  { key: "o3", label: "O₃" },
  { key: "no2", label: "NO₂" },
  { key: "hc", label: "HC" },
];

const IspuPage = () => {
  const navigate = useNavigate();

  const [basicMap, setBasicMap] = useState({});
  const [advMap, setAdvMap] = useState({});
  const [activeTab, setActiveTab] = useState("basic"); // ← NEW TAB CONTROL

  useEffect(() => {
    const checkData = async () => {
      let basicStatus = {};
      let advStatus = {};

      for (let p of pollutants) {
        const basicRes = await fetch(`${API_BASE}/forecast/${p.key}`);
        const basicData = await basicRes.json();
        basicStatus[p.key] = basicData.length > 0;

        const advRes = await fetch(`${API_BASE}/forecast/${p.key}/advanced`);
        const advData = await advRes.json();
        advStatus[p.key] = advData.length > 0;
      }

      setBasicMap(basicStatus);
      setAdvMap(advStatus);

      // AUTO SWITCH TAB:
      if (Object.values(advStatus).some((v) => v)) {
        setActiveTab("advanced");
      } else {
        setActiveTab("basic");
      }
    };

    checkData();
  }, []);

  // Routing
  const handleBasic = (key) => navigate(`/forecast/basic/${key}`);
  const handleAdvanced = (key) => navigate(`/forecast/advanced/${key}`);

  // Cards for selected tab
  const items =
    activeTab === "basic"
      ? pollutants.filter((p) => basicMap[p.key])
      : pollutants.filter((p) => advMap[p.key]);

  const noData = items.length === 0;

  return (
    <div
      className="container d-flex flex-column justify-content-center"
      style={{ minHeight: "100vh" }}>
      <h3 className="fw-bold text-center mb-3">Forecast Result</h3>
      <p className="text-center text-muted">Choose forecast type</p>

      {/* =========================== */}
      {/*         TAB SWITCHER        */}
      {/* =========================== */}
      <div className="d-flex justify-content-center gap-2 mb-4">
        <button
          className={`btn ${
            activeTab === "basic" ? "btn-primary" : "btn-outline-primary"
          }`}
          style={{ width: "120px", borderRadius: "20px" }}
          onClick={() => setActiveTab("basic")}>
          Basic
        </button>

        <button
          className={`btn ${
            activeTab === "advanced" ? "btn-primary" : "btn-outline-primary"
          }`}
          style={{ width: "120px", borderRadius: "20px" }}
          onClick={() => setActiveTab("advanced")}>
          Advanced
        </button>
      </div>

      {/* =========================== */}
      {/*         NO DATA ALERT       */}
      {/* =========================== */}
      {noData && (
        <div className="alert alert-warning text-center">
          No {activeTab} forecast found.
        </div>
      )}

      {/* =========================== */}
      {/*            CARDS            */}
      {/* =========================== */}
      {!noData && (
        <div className="row g-3 justify-content-center">
          {items.map((p) => (
            <div
              key={p.key}
              className="col-6 col-md-4"
              style={{ maxWidth: "150px" }}>
              <div
                className="card text-center shadow-sm border-0"
                style={{
                  padding: "20px 10px",
                  borderRadius: "18px",
                  cursor: "pointer",
                }}
                onClick={() =>
                  activeTab === "advanced"
                    ? handleAdvanced(p.key)
                    : handleBasic(p.key)
                }>
                <h4 className="fw-bold mb-2">{p.label}</h4>

                {/* BADGE */}
                <div className="d-flex gap-1 justify-content-center mt-1">
                  {basicMap[p.key] && (
                    <span className="badge bg-success">Basic</span>
                  )}
                  {advMap[p.key] && (
                    <span className="badge bg-primary">Advanced</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IspuPage;
