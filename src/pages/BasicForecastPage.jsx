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

const BasicForecastPage = () => {
  const { pol } = useParams();
  const navigate = useNavigate();

  const [forecastData, setForecastData] = useState([]);
  const [noData, setNoData] = useState(false);
  const [noDataMsg, setNoDataMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(forecastData.length / rowsPerPage);
  const indexFirst = (currentPage - 1) * rowsPerPage;
  const currentRows = forecastData.slice(indexFirst, indexFirst + rowsPerPage);

  // Pagination Display Logic (Same as ModelPage)
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

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`${API_BASE}/forecast/${pol}`);

        if (!res.ok) {
          setNoData(true);
          setNoDataMsg(`⚠ Failed to fetch forecast for ${pol.toUpperCase()}.`);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (!data || data.length === 0) {
          setNoData(true);
          setNoDataMsg(
            `⚠ No forecast data found for ${pol.toUpperCase()}. Please run Basic Forecast first.`
          );
          setLoading(false);
          return;
        }

        setForecastData(data);
      } catch (err) {
        setNoData(true);
        setNoDataMsg(`⚠ Failed to load forecast for ${pol.toUpperCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [pol]);

  // ==========================
  // CHART 70%
  // ==========================
  const chartData = {
    labels: forecastData.map((d) => d.ds),
    datasets: [
      {
        label: "yhat",
        data: forecastData.map((d) => d.yhat),
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: "yhat_lower",
        data: forecastData.map((d) => d.yhat_lower),
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: "yhat_upper",
        data: forecastData.map((d) => d.yhat_upper),
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    <div className="container py-4">
      {/* Back Button iOS */}
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

      <h2 className="fw-bold mb-4 text-center">
        Basic Forecast Result — {pol.toUpperCase()}
      </h2>

      {/* LOADING */}
      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Loading forecast...</p>
        </div>
      )}

      {/* NO DATA */}
      {!loading && noData && (
        <div className="alert alert-warning text-center mt-4" role="alert">
          {noDataMsg}
        </div>
      )}

      {/* ===================== */}
      {/* CHART 70% */}
      {/* ===================== */}
      {!loading && !noData && (
        <div
          className="card p-4 shadow-sm mb-4"
          style={{ height: "70vh", minHeight: "400px" }}>
          <h5 className="fw-bold mb-3 text-center">Forecast Chart</h5>
          <div style={{ height: "100%" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* TABLE 30% + Pagination */}
      {/* ===================== */}

      {!loading && !noData && (
        <div
          className="shadow-sm border rounded p-3"
          style={{ minHeight: "30vh" }}>
          <h5 className="fw-bold mb-3">Forecast Table</h5>

          <div className="table-responsive" style={{ maxHeight: "250px" }}>
            <table className="table table-bordered table-striped">
              <thead className="table-success">
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>yhat</th>
                  <th>yhat_lower</th>
                  <th>yhat_upper</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION — SAME STYLE AS ModelPage.jsx */}
          <ul className="pagination mt-3 pagination-centered">
            {/* PREV */}
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p - 1)}>
                Previous
              </button>
            </li>

            {/* NUMBERS */}
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

            {/* NEXT */}
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
      )}
    </div>
  );
};

export default BasicForecastPage;
