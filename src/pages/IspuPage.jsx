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
  const [activeTab, setActiveTab] = useState("basic"); // DEFAULT BASIC

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
    };

    checkData();
  }, []);

  const handleBasic = (key) => navigate(`/forecast/basic/${key}`);
  const handleAdvanced = (key) => navigate(`/forecast/advanced/${key}`);

  // ITEMS BY TAB
  const items =
    activeTab === "basic"
      ? pollutants.filter((p) => basicMap[p.key])
      : pollutants.filter((p) => advMap[p.key]);

  const noData = items.length === 0;

  return (
    <div
      className="container d-flex flex-column justify-content-start"
      style={{
        minHeight: "100vh",
        marginTop: "80px", // ➜ AGAR MEPET HEADER MODE MOBILE
      }}>
      <h3 className="fw-bold text-center mb-2">Forecast Result</h3>
      <p className="text-center text-muted mb-3">Choose forecast type</p>

      {/* ============================== */}
      {/*         TAB SWITCHER           */}
      {/* ============================== */}
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

      {/* ============================== */}
      {/*            NO DATA             */}
      {/* ============================== */}
      {noData && (
        <div className="alert alert-warning text-center">
          No {activeTab} forecast found.
        </div>
      )}

      {/* ============================== */}
      {/*            CARDS               */}
      {/* ============================== */}
      {!noData && (
        <div className="row g-3 justify-content-center">
          {items.map((p) => (
            <div
              key={p.key}
              className="col-6 col-md-3"
              style={{ maxWidth: "160px" }}>
              <div
                className="card text-center shadow-sm border-0"
                style={{
                  padding: "20px 10px",
                  borderRadius: "18px",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                onClick={() =>
                  activeTab === "advanced"
                    ? handleAdvanced(p.key)
                    : handleBasic(p.key)
                }>
                <h4 className="fw-bold mb-2">{p.label}</h4>

                {/* BADGE SESUAI TAB */}
                {activeTab === "basic" && (
                  <span className="badge bg-success">Basic</span>
                )}

                {activeTab === "advanced" && (
                  <span className="badge bg-primary">Advanced</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IspuPage;
