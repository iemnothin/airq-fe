// import React from "react";
// import { useNavigate } from "react-router-dom";

// const pollutants = [
//   { key: "pm10", label: "PM10" },
//   { key: "pm25", label: "PM25" },
//   { key: "so2", label: "SO\u2082" },
//   { key: "co", label: "CO" },
//   { key: "o3", label: "O\u2083" },
//   { key: "no2", label: "NO\u2082" },
//   { key: "hc", label: "HC" },
// ];

// const BasicForecastPage = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="container py-4">
//       <h2 className="fw-bold mb-4 text-center">Basic Forecast Result</h2>
//       <p className="text-center text-muted mb-4">
//         Select pollutant to view 30-day forecast result
//       </p>

//       <div className="row g-4">
//         {pollutants.map((p, i) => (
//           <div className="col-12 col-md-4 col-lg-3" key={i}>
//             <div
//               className="card shadow-sm border-0 h-100"
//               style={{ cursor: "pointer" }}
//               onClick={() => navigate(`/forecast/basic/${p.key}`)}>
//               <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
//                 <h3 className="fw-bold mb-2">{p.label}</h3>
//                 <span className="text-muted">View forecast →</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BasicForecastPage;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://api-airq.abiila.com/api/v1";

const pollutants = [
  { key: "pm10", label: "PM10" },
  { key: "pm25", label: "PM25" },
  { key: "so2", label: "SO\u2082" },
  { key: "co", label: "CO" },
  { key: "o3", label: "O\u2083" },
  { key: "no2", label: "NO\u2082" },
  { key: "hc", label: "HC" },
];

const BasicForecastPage = () => {
  const navigate = useNavigate();
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    const checkForecastData = async () => {
      try {
        let allEmpty = true;

        for (let p of pollutants) {
          const res = await fetch(`${API_BASE}/forecast/${p.key}`);
          const data = await res.json();

          if (data && data.length > 0) {
            allEmpty = false;
            break; // minimal 1 ada → jangan tampilkan alert
          }
        }

        setNoData(allEmpty);
      } catch (err) {
        setNoData(true);
      }
    };

    checkForecastData();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-center">Basic Forecast Result</h2>
      <p className="text-center text-muted mb-4">
        Select pollutant to view 30-day forecast result
      </p>

      {/* ALERT */}
      {noData && (
        <div className="alert alert-warning text-center mb-4" role="alert">
          ⚠ No data exist. Forecasting first!
        </div>
      )}

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
    </div>
  );
};

export default BasicForecastPage;
