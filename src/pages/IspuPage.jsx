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
          const basicRes = await fetch(`${API_BASE}/forecast/${p.key}`);
          const basicData = await basicRes.json();
          basicStatus[p.key] = basicData.length > 0;

          const advRes = await fetch(`${API_BASE}/forecast/${p.key}/advanced`);
          const advData = await advRes.json();
          advStatus[p.key] = advData.length > 0;
        }

        setBasicMap(basicStatus);
        setAdvMap(advStatus);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    checkData();
  }, []);

  const handleClick = (key) => {
    if (advMap[key]) navigate(`/forecast/advanced/${key}`);
    else navigate(`/forecast/basic/${key}`);
  };

  const noBasic = !Object.values(basicMap).some(Boolean);
  const noAdvanced = !Object.values(advMap).some(Boolean);
  const nothingAvailable = noBasic && noAdvanced;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3 text-center">Forecast Result</h2>
      <p className="text-center text-muted mb-4">
        Choose pollutant to view its forecast
      </p>

      {nothingAvailable && (
        <div className="alert alert-warning text-center">
          ⚠ No forecast available. Please process forecast first!
        </div>
      )}

      {!nothingAvailable && (
        <div className="row g-3">
          {pollutants.map((p) => {
            const hasBasic = basicMap[p.key];
            const hasAdv = advMap[p.key];

            if (!hasBasic && !hasAdv) return null;

            return (
              <div className="col-6 col-md-4 col-lg-3" key={p.key}>
                <div
                  className="card shadow-sm border-0 text-center py-4"
                  style={{
                    cursor: "pointer",
                    borderRadius: "16px",
                    transition: "0.2s ease",
                  }}
                  onClick={() => handleClick(p.key)}>
                  <h3 className="fw-bold mb-2">{p.label}</h3>

                  {hasAdv && <span className="badge bg-primary">Advanced</span>}
                  {!hasAdv && hasBasic && (
                    <span className="badge bg-success">Basic</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IspuPage;
