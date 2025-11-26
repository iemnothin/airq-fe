import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

const IspuPage = () => {
  const { pol } = useParams();
  const [forecastData, setForecastData] = useState([]);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`${API_BASE}/forecast/${pol}`);
        const data = await res.json();

        if (!data || data.length === 0) {
          setNoData(true);
          return;
        }

        setForecastData(data);
      } catch (err) {
        setNoData(true);
      }
    };

    fetchForecast();
  }, [pol]);

  // ==========================
  // CHART DATA
  // ==========================
  const chartData = {
    labels: forecastData.map((d) => d.ds),
    datasets: [
      {
        label: "yhat (Forecast)",
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
      legend: {
        position: "top",
      },
    },
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-center">
        Basic Forecast Result — {pol.toUpperCase()}
      </h2>

      {/* ALERT */}
      {noData && (
        <div className="alert alert-warning text-center mt-4" role="alert">
          ⚠ No data exist. Forecasting first!
        </div>
      )}

      {/* GRAPH */}
      {!noData && (
        <div className="card p-4 shadow-sm mb-4">
          <h5 className="fw-bold mb-3 text-center">Forecast Chart</h5>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* TABLE */}
      {!noData && (
        <div className="table-responsive shadow-sm mt-4">
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
              {forecastData.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{row.ds}</td>
                  <td>{row.yhat}</td>
                  <td>{row.yhat_lower}</td>
                  <td>{row.yhat_upper}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IspuPage;
