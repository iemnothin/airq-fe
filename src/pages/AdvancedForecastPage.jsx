import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const API_BASE = "https://api-airq.abiila.com/api/v1";

const AdvancedForecastPage = () => {
  const { pol } = useParams();
  const navigate = useNavigate();

  const [forecastData, setForecastData] = useState([]);
  const [noData, setNoData] = useState(false);
  const [noDataMsg, setNoDataMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`${API_BASE}/forecast/${pol}/advanced`);
        const data = await res.json();

        if (!data || data.length === 0) {
          setNoData(true);
          setNoDataMsg(
            `⚠ No advanced forecast data for ${pol.toUpperCase()}. Please run advanced forecast first.`
          );
          setLoading(false);
          return;
        }

        setForecastData(data);
      } catch {
        setNoData(true);
        setNoDataMsg(
          `⚠ Failed to load advanced forecast for ${pol.toUpperCase()}.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [pol]);

  const totalPages = Math.ceil(forecastData.length / rowsPerPage);
  const indexFirst = (currentPage - 1) * rowsPerPage;
  const currentRows = forecastData.slice(indexFirst, indexFirst + rowsPerPage);

  const getPageNumbers = () => {
    if (totalPages <= 5) return [...Array(totalPages).keys()].map((x) => x + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];

    if (currentPage >= totalPages - 2)
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const chartData = {
    labels: forecastData.map((d) => d.ds),
    datasets: [
      {
        label: "Forecast (yhat)",
        data: forecastData.map((d) => d.yhat),
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: "Lower Bound",
        data: forecastData.map((d) => d.yhat_lower),
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: "Upper Bound",
        data: forecastData.map((d) => d.yhat_upper),
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  return (
    <div className="container py-4">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/forecast/results")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "12px",
          background: "rgba(245, 245, 247, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.08)",
          color: "#007aff",
          fontWeight: 500,
          cursor: "pointer",
          fontSize: "15px",
          transition: "all 0.25s ease",
        }}>
        <i className="fas fa-chevron-left" style={{ fontSize: "14px" }}></i>
        Back to Results
      </button>

      <h2 className="fw-bold text-center mt-3 mb-4">
        Advanced Forecast Result — {pol.toUpperCase()}
      </h2>

      {/* NO DATA */}
      {noData && (
        <div className="alert alert-warning text-center mt-4">{noDataMsg}</div>
      )}

      {/* CONTENT */}
      {!noData && (
        <div className="d-flex flex-column flex-lg-row gap-4">
          {/* CHART */}
          <div className="flex-grow-1">
            <div
              className="card p-4 shadow-sm"
              style={{ height: "70vh", minHeight: "400px" }}>
              <h5 className="fw-bold mb-3 text-center">Forecast Chart</h5>
              <div style={{ height: "100%" }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div
            className="shadow-sm border rounded p-3"
            style={{ width: "100%", maxWidth: "380px" }}>
            <h5 className="fw-bold mb-3">Forecast Table</h5>

            <div className="table-responsive" style={{ maxHeight: "300px" }}>
              <table className="table table-bordered table-striped">
                <thead className="table-success">
                  <tr>
                    <th>No</th>
                    <th>Date</th>
                    <th>yhat</th>
                    <th>yhat_lower</th>
                    <th>yhat_upper</th>
                    <th>Changepoint Prior</th>
                    <th>Seasonality Prior</th>
                    <th>Holiday Prior</th>
                    <th>MAPE</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, i) => (
                    <tr key={i}>
                      <td>{indexFirst + i + 1}</td>
                      <td>{row.ds}</td>
                      <td>{row.yhat}</td>
                      <td>{row.yhat_lower}</td>
                      <td>{row.yhat_upper}</td>
                      <td>{row.changepoint_prior_scale}</td>
                      <td>{row.seasonality_prior_scale}</td>
                      <td>{row.holidays_prior_scale}</td>
                      <td>{row.model_mape?.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <ul className="pagination pagination-centered mt-3">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => p - 1)}>
                  Previous
                </button>
              </li>

              {getPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <li key={idx} className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                ) : (
                  <li
                    key={idx}
                    className={`page-item ${
                      currentPage === num ? "active" : ""
                    }`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(num)}>
                      {num}
                    </button>
                  </li>
                )
              )}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => p + 1)}>
                  Next
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedForecastPage;
