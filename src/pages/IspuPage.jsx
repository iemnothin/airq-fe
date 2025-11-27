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

  const [basicEmpty, setBasicEmpty] = useState(false);
  const [advEmpty, setAdvEmpty] = useState(false);

  useEffect(() => {
    const checkData = async () => {
      try {
        let basicMissing = true;
        let advMissing = true;

        for (let p of pollutants) {
          // ===================
          // CHECK BASIC FORECAST
          // ===================
          const basicRes = await fetch(`${API_BASE}/forecast/${p.key}`);
          const basicData = await basicRes.json();
          if (basicData && basicData.length > 0) {
            basicMissing = false;
          }

          // ===================
          // CHECK ADVANCED FORECAST
          // ===================
          const advRes = await fetch(`${API_BASE}/forecast/${p.key}/advanced`);

          const advData = await advRes.json();
          if (advData && advData.length > 0) {
            advMissing = false;
          }
        }

        setBasicEmpty(basicMissing);
        setAdvEmpty(advMissing);
      } catch (err) {
        setBasicEmpty(true);
        setAdvEmpty(true);
      }
    };

    checkData();
  }, []);

  const hasAnyData = !basicEmpty || !advEmpty;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-center">View Forecast Result</h2>

      <p className="text-center text-muted mb-4">
        Select pollutant to view forecast results
      </p>

      {/* Alert Basic Forecast */}
      {basicEmpty && (
        <div className="alert alert-warning text-center mb-4" role="alert">
          ⚠ No Basic Forecast Found. Run Basic Forecast First!
        </div>
      )}

      {/* Alert Advanced Forecast */}
      {advEmpty && (
        <div className="alert alert-warning text-center mb-4" role="alert">
          ⚠ No Advanced Forecast Found. Run Advanced Forecast First!
        </div>
      )}

      {/* SHOW CARDS ONLY WHEN AT LEAST ONE DATA SOURCE EXISTS */}
      {hasAnyData && (
        <div className="row g-4">
          {pollutants.map((p, i) => (
            <div className="col-12 col-md-4 col-lg-3" key={i}>
              <div
                className="card shadow-sm border-0 h-100"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/forecast/basic/${p.key}`)}>
                <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                  <h3 className="fw-bold mb-2">{p.label}</h3>
                  <span className="text-muted">View forecast →</span>
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
