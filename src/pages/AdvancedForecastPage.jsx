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

  const rowsPerPage = 10;
  const [page, setPage] = useState(1);

  const indexOfFirst = (page - 1) * rowsPerPage;
  const currentRows = forecastData.slice(
    indexOfFirst,
    indexOfFirst + rowsPerPage
  );
  const totalPages = Math.ceil(forecastData.length / rowsPerPage);

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
          return;
        }

        setForecastData(data);
      } catch (err) {
        setNoData(true);
        setNoDataMsg(
          `⚠ Failed to load advanced forecast for ${pol.toUpperCase()}.`
        );
      }
    };

    fetchForecast();
  }, [pol]);

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
    maintainAspectRatio: false, // ⬅️ wajib biar height mengikuti container
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1800px" }}>
      {/* Back Button */}
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
          border: "1px solid rgba(0,0,0,0.08)",
          color: "#007aff",
          fontWeight: 500,
          cursor: "pointer",
          fontSize: "15px",
        }}>
        <i className="fas fa-chevron-left" style={{ fontSize: "14px" }}></i>
        Back to Results
      </button>

      <h2 className="fw-bold mb-4 text-center">
        Advanced Forecast Result — {pol.toUpperCase()}
      </h2>

      {noData && (
        <div className="alert alert-warning text-center">{noDataMsg}</div>
      )}

      {!noData && (
        <div className="d-flex flex-column flex-lg-row gap-4">
          {/* LEFT — CHART */}
          <div className="flex-grow-1">
            <div className="card p-4 shadow-sm chart-wrapper">
              <h5 className="fw-bold mb-3 text-center">Forecast Chart</h5>
              <div style={{ height: "100%" }}>
                <div className="chart-scroll">
                  <div className="chart-wrapper">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — TABLE */}
          <div
            className="card shadow-sm border p-3"
            style={{
              maxWidth: "420px",
              height: "70vh",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
            }}>
            <h5 className="fw-bold mb-3">Forecast Table</h5>

            <div
              className="table-responsive"
              style={{
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "auto",
              }}>
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
                      <td>{indexOfFirst + i + 1}</td>
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

            {/* Pagination */}
            <div className="mt-3 text-center">
              <ul className="pagination pagination-centered justify-content-center">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <li
                      key={num}
                      className={`page-item ${page === num ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(num)}>
                        {num}
                      </button>
                    </li>
                  )
                )}

                <li
                  className={`page-item ${
                    page === totalPages ? "disabled" : ""
                  }`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedForecastPage;
