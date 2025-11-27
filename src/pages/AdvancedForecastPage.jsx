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

const AdvancedForecastPage = () => {
  const { pol } = useParams();
  const [forecastData, setForecastData] = useState([]);
  const [noData, setNoData] = useState(false);
  const [noDataMsg, setNoDataMsg] = useState("");

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

  // ==========================
  // CHART CONFIG
  // ==========================
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
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4 text-center">
        Advanced Forecast Result — {pol.toUpperCase()}
      </h2>

      {/* ALERT */}
      {noData && (
        <div className="alert alert-warning text-center mt-4" role="alert">
          {noDataMsg}
        </div>
      )}

      {/* CHART */}
      {!noData && (
        <div className="card p-4 shadow-sm mb-4">
          <h5 className="fw-bold mb-3 text-center">Forecast Chart</h5>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* FORECAST TABLE */}
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
                <th>Changepoint Prior</th>
                <th>Seasonality Prior</th>
                <th>Holiday Prior</th>
                <th>MAPE</th>
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
                  <td>{row.changepoint_prior_scale}</td>
                  <td>{row.seasonality_prior_scale}</td>
                  <td>{row.holidays_prior_scale}</td>
                  <td>{row.model_mape?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdvancedForecastPage;
