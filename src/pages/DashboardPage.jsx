import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";

import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";
import "../css/DashboardPage.css"; // ⬅️ untuk animasi pulse

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartHistory, setChartHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [latency, setLatency] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [restartMsg, setRestartMsg] = useState(null);

  const toWIB = (ts) => {
    const date = new Date(ts);
    date.setHours(date.getHours() + 7); // konversi UTC → WIB
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const fetchStatus = async () => {
    const start = performance.now();
    try {
      const res = await fetch("https://api-airq.abiila.com/api/v1/status");
      const data = await res.json();
      const end = performance.now();
      setLatency((end - start).toFixed(0));
      setStatus(data);

      setChartHistory((prev) => [
        ...prev.slice(-19),
        {
          time: new Date().toLocaleTimeString("id-ID"),
          cpu: parseFloat(data.cpu_usage),
          ram: parseFloat(data.ram_usage),
        },
      ]);

      setAlertMsg(
        data.backend === "critical" ? "⚠ Backend dalam kondisi CRITICAL!" : null
      );
    } catch {
      setStatus(null);
      setAlertMsg("❌ API tidak dapat dihubungi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/status/history"
      );
      const data = await res.json();
      const sorted = [...data.history].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTimeline(sorted);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchTimeline();

    const interval = setInterval(
      () => {
        fetchStatus();
        fetchTimeline();
      },
      status?.backend === "degraded" ? 5000 : 10000
    );
    return () => clearInterval(interval);
  }, [status?.backend]);

  const restartBackend = async () => {
    if (!window.confirm("⚠ Restart backend FastAPI?")) return;
    setRestarting(true);
    try {
      await fetch("https://api-airq.abiila.com/api/v1/status/restart", {
        method: "POST",
        headers: { admin_key: "AirQ-Admin-2025" },
      });
      setRestartMsg({ type: "success", text: "Backend berhasil direstart 🚀" });
      setTimeout(fetchStatus, 5000);
    } catch {
      setRestartMsg({ type: "danger", text: "❌ Gagal restart backend!" });
    } finally {
      setRestarting(false);
    }
  };

  const filteredTimeline = timeline
    .filter((item) =>
      searchDate
        ? new Date(item.timestamp).toISOString().slice(0, 10) === searchDate
        : true
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getStatusStyle = (color) => ({
    borderRadius: "12px",
    padding: "8px 18px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    color: "white",
    fontSize: "1rem",
    backgroundColor: color,
  });

  const backendMap = {
    healthy: { label: "Healthy", color: "#28a745", icon: <FaCheckCircle /> },
    degraded: {
      label: "Degraded",
      color: "#ffc107",
      icon: <FaExclamationTriangle />,
    },
    critical: { label: "Critical", color: "#dc3545", icon: <FaTimesCircle /> },
    unknown: { label: "Unknown", color: "#6c757d", icon: <FaInfoCircle /> },
  };

  const backendUI = backendMap[status?.backend] || backendMap.unknown;

  return (
    <div className="container py-4 animate__animated animate__fadeIn">
      {alertMsg && (
        <div className="alert alert-danger text-center fw-bold rounded-4 py-2 animate__animated animate__shakeX">
          {alertMsg}
        </div>
      )}

      {restartMsg && (
        <div
          className={`alert alert-${restartMsg.type} text-center fw-bold rounded-4 py-2`}>
          {restartMsg.text}
        </div>
      )}

      <div className="mb-4 text-center text-md-start">
        <h2 className="fw-bold text-success mb-1">Dashboard Sistem AirQ</h2>
        <p className="text-muted mb-0">
          Ringkasan status sistem dan teknologi yang digunakan.
        </p>
      </div>

      {/* STATUS SYSTEM */}
      <Card className="mb-4 shadow-sm border-0 rounded-4">
        <Card.Body>
          <h5 className="fw-bold text-primary mb-3 text-center">
            Status Sistem
          </h5>

          <div className="text-center mb-4">
            <button
              className="btn btn-danger px-4 rounded-4 fw-bold"
              onClick={restartBackend}
              disabled={restarting}>
              {restarting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaSyncAlt className="me-2" />
              )}
              Restart Backend
            </button>
          </div>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="success" />
              <p className="text-muted mt-2">Memuat status sistem...</p>
            </div>
          ) : (
            <Row className="g-4 justify-content-center">
              <Col md={4} sm={6}>
                <Card className="shadow-sm border-0 rounded-4 p-4 text-center h-100">
                  <div style={getStatusStyle(backendUI.color)}>
                    {backendUI.icon} {backendUI.label}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Backend</h6>
                  <p className="small text-muted mb-0">
                    CPU {status.cpu_usage} · RAM {status.ram_usage} · {latency}{" "}
                    ms
                  </p>
                </Card>
              </Col>

              <Col md={4} sm={6}>
                <Card className="shadow-sm border-0 rounded-4 p-4 text-center h-100">
                  <div
                    style={getStatusStyle(
                      status.database === "connected" ? "#28a745" : "#dc3545"
                    )}>
                    {status.database === "connected" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                    {status.database === "connected"
                      ? "Connected"
                      : "Disconnected"}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Database</h6>
                </Card>
              </Col>

              <Col md={4} sm={6}>
                <Card className="shadow-sm border-0 rounded-4 p-4 text-center h-100">
                  <div
                    style={getStatusStyle(
                      status.model_status === "ready" ? "#28a745" : "#dc3545"
                    )}>
                    {status.model_status === "ready" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                    {status.model_status === "ready" ? "Ready" : "Not Ready"}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Model</h6>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* GRAFIK + TIMELINE */}
      <Row className="g-4">
        {/* GRAPH */}
        <Col md={8}>
          {chartHistory.length > 0 && (
            <Card className="mb-4 shadow-sm border-0 rounded-4">
              <Card.Body>
                <h5 className="fw-bold text-primary mb-3 text-center">
                  Resource Monitoring (Realtime)
                </h5>
                <Line
                  data={{
                    labels: chartHistory.map((x) => x.time),
                    datasets: [
                      {
                        label: "CPU (%)",
                        data: chartHistory.map((x) => x.cpu),
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 2,
                        pointRadius: 4,
                        tension: 0.35,
                      },
                      {
                        label: "RAM (%)",
                        data: chartHistory.map((x) => x.ram),
                        borderColor: "rgba(255, 159, 64, 1)",
                        borderWidth: 2,
                        pointRadius: 4,
                        tension: 0.35,
                      },
                    ],
                  }}
                  options={{
                    plugins: { legend: { display: true } },
                    scales: { y: { min: 0, max: 100 } },
                  }}
                  height={95}
                />
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* TIMELINE */}
        <Col md={4}>
          <Card
            className="shadow-sm border-0 rounded-4 h-100"
            style={{ position: "sticky", top: 15 }}>
            <Card.Body style={{ maxHeight: "520px", overflowY: "auto" }}>
              <h5 className="fw-bold text-primary position-sticky top-0 bg-white py-2 mb-3">
                Activity Timeline (24h)
              </h5>

              <input
                type="date"
                className="form-control mb-3 rounded-4"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />

              {filteredTimeline.length === 0 ? (
                <p className="text-center text-muted">
                  Riwayat tidak ditemukan.
                </p>
              ) : (
                <ul className="timeline list-unstyled">
                  {filteredTimeline.map((item, idx) => {
                    const color =
                      item.backend === "healthy"
                        ? "timeline-green"
                        : item.backend === "degraded"
                        ? "timeline-yellow"
                        : "timeline-red";
                    return (
                      <li key={idx} className={`mb-3 pulse ${color}`}>
                        <div className="fw-bold">{toWIB(item.timestamp)}</div>
                        <small className="text-muted">
                          CPU {item.cpu_usage}% — RAM {item.ram_usage}%
                        </small>
                        <div className="fw-bold text-uppercase mt-1">
                          {item.backend}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* TECHNOLOGY */}
      <footer className="mt-5 text-center text-muted small">
        © {new Date().getFullYear()} AirQ — abiila
      </footer>
    </div>
  );
};

export default DashboardPage;
