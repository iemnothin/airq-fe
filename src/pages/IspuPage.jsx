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

  useEffect(() => {
    const checkData = async () => {
      try {
        let basicStatus = {};
        let advStatus = {};

        for (let p of pollutants) {
          // BASIC CHECK
          const basicRes = await fetch(`${API_BASE}/forecast/${p.key}`);
          const basicData = await basicRes.json();
          basicStatus[p.key] = basicData.length > 0;

          // ADVANCED CHECK
          const advRes = await fetch(`${API_BASE}/forecast/${p.key}/advanced`);
          const advData = await advRes.json();
          advStatus[p.key] = advData.length > 0;
        }

        setBasicMap(basicStatus);
        setAdvMap(advStatus);
      } catch (err) {
        console.log("Error checking forecast data:", err);
      }
    };

    checkData();
  }, []);

  const handleBasic = (key) => navigate(`/forecast/basic/${key}`);
  const handleAdvanced = (key) => navigate(`/forecast/advanced/${key}`);

  const basicAvailable = Object.values(basicMap).some((v) => v === true);
  const advancedAvailable = Object.values(advMap).some((v) => v === true);

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-center">View Forecast Result</h2>

      <p className="text-center text-muted mb-4">
        Select forecast type you want to view
      </p>

      {/* =============================== */}
      {/* EMPTY ALERTS */}
      {/* =============================== */}
      {!basicAvailable && (
        <div className="alert alert-warning text-center">
          ⚠ No Basic Forecast Found. Run Basic Forecast First!
        </div>
      )}

      {!advancedAvailable && (
        <div className="alert alert-warning text-center">
          ⚠ No Advanced Forecast Found. Run Advanced Forecast First!
        </div>
      )}

      {/* =============================== */}
      {/* BASIC FORECAST SECTION */}
      {/* =============================== */}
      {basicAvailable && (
        <>
          <h4 className="fw-bold mt-4 mb-3">Basic Forecast</h4>
          <div className="row g-4">
            {pollutants.map(
              (p) =>
                basicMap[p.key] && (
                  <div className="col-12 col-md-4 col-lg-3" key={p.key}>
                    <div
                      className="card shadow-sm border-0 h-100"
                      style={{
                        cursor: "pointer",
                        borderRadius: "14px",
                        transition: "0.2s",
                      }}
                      onClick={() => handleBasic(p.key)}>
                      <div className="card-body d-flex flex-column align-items-center justify-content-center py-4">
                        <h3 className="fw-bold">{p.label}</h3>
                        <span className="text-muted mb-2">
                          View basic forecast →
                        </span>
                        <span className="badge bg-success">Basic</span>
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>
        </>
      )}

      {/* =============================== */}
      {/* ADVANCED FORECAST SECTION */}
      {/* =============================== */}
      {advancedAvailable && (
        <>
          <h4 className="fw-bold mt-5 mb-3">Advanced Forecast</h4>
          <div className="row g-4">
            {pollutants.map(
              (p) =>
                advMap[p.key] && (
                  <div className="col-12 col-md-4 col-lg-3" key={p.key}>
                    <div
                      className="card shadow-sm border-0 h-100"
                      style={{
                        cursor: "pointer",
                        borderRadius: "14px",
                        transition: "0.2s",
                      }}
                      onClick={() => handleAdvanced(p.key)}>
                      <div className="card-body d-flex flex-column align-items-center justify-content-center py-4">
                        <h3 className="fw-bold">{p.label}</h3>
                        <span className="text-muted mb-2">
                          View advanced forecast →
                        </span>
                        <span className="badge bg-primary">Advanced</span>
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IspuPage;
