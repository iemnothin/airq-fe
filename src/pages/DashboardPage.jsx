import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Form } from "react-bootstrap";
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
  FaClock,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSearch,
} from "react-icons/fa";

import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";

// REGISTER CHART COMPONENTS
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
  const [history, setHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [timelineBackup, setTimelineBackup] = useState([]); // backup for search
  const [timelineSearch, setTimelineSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const [latency, setLatency] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [restartMsg, setRestartMsg] = useState(null);

  const fetchStatus = async () => {
    const start = performance.now();
    try {
      const response = await fetch("https://api-airq.abiila.com/api/v1/status");
      const data = await response.json();
      const end = performance.now();

      setLatency((end - start).toFixed(0));
      setStatus(data);

      setHistory((prev) => [
        ...prev.slice(-19),
        {
          time: new Date().toLocaleTimeString(),
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

  const fetchHistoryTimeline = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/status/history"
      );
      const data = await res.json();
      setTimeline(data.history || []);
      setTimelineBackup(data.history || []);
    } catch {
      setTimeline([]);
      setTimelineBackup([]);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistoryTimeline();

    const interval = setInterval(
      () => {
        fetchStatus();
        fetchHistoryTimeline();
      },
      status?.backend === "degraded" ? 5000 : 10000
    );

    return () => clearInterval(interval);
  }, [status?.backend]);

  const restartBackend = async () => {
    if (!window.confirm("⚠ Restart backend FastAPI?")) return;
    setRestarting(true);
    setRestartMsg(null);

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

  const handleSearch = (keyword) => {
    setTimelineSearch(keyword);
    if (!keyword) return setTimeline(timelineBackup);

    const filtered = timelineBackup.filter(
      (x) =>
        x.timestamp.toLowerCase().includes(keyword.toLowerCase()) ||
        x.backend.toLowerCase().includes(keyword.toLowerCase()) ||
        x.cpu_usage.toString().includes(keyword) ||
        x.ram_usage.toString().includes(keyword)
    );
    setTimeline(filtered);
  };

  const toggleSort = () => {
    setSortAsc(!sortAsc);
    const sorted = [...timeline].sort(
      (a, b) =>
        sortAsc
          ? new Date(b.timestamp) - new Date(a.timestamp) // next click → newest bottom
          : new Date(a.timestamp) - new Date(b.timestamp) // first click → oldest bottom
    );
    setTimeline(sorted);
  };

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
          className={`alert alert-${restartMsg.type} text-center fw-bold rounded-4 py-2 animate__animated animate__fadeIn`}>
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
                <>
                  <Spinner animation="border" size="sm" /> Restarting...
                </>
              ) : (
                <>
                  <FaSyncAlt className="me-2" />
                  Restart Backend
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="success" />
              <p className="text-muted mt-2">Memuat status sistem...</p>
            </div>
          ) : !status ? (
            <div className="text-center text-danger py-3">
              ❌ Tidak dapat memuat status sistem.
            </div>
          ) : (
            <Row className="g-4 justify-content-center">
              <Col md={4} sm={6}>
                <Card className="shadow-sm border-0 rounded-4 p-4 text-center h-100">
                  <div
                    style={getStatusStyle(backendUI.color)}
                    className="mx-auto">
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
                    )}
                    className="mx-auto">
                    {status.database === "connected" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}{" "}
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
                    )}
                    className="mx-auto">
                    {status.model_status === "ready" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}{" "}
                    {status.model_status === "ready" ? "Ready" : "Not Ready"}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Model</h6>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* CHART + TIMELINE */}
      <Row>
        <Col md={8}>
          {history.length > 0 && (
            <Card className="mb-4 shadow-sm border-0 rounded-4">
              <Card.Body>
                <h5 className="fw-bold text-primary mb-3 text-center">
                  Resource Monitoring (Realtime)
                </h5>
                <Line
                  data={{
                    labels: history.map((x) => x.time),
                    datasets: [
                      {
                        label: "CPU (%)",
                        data: history.map((x) => x.cpu),
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: (ctx) => {
                          const g = ctx.chart.ctx.createLinearGradient(
                            0,
                            0,
                            0,
                            300
                          );
                          g.addColorStop(0, "rgba(75, 192, 192, 0.4)");
                          g.addColorStop(1, "rgba(75, 192, 192, 0)");
                          return g;
                        },
                        pointRadius: 4,
                        borderWidth: 2,
                        tension: 0.35,
                      },
                      {
                        label: "RAM (%)",
                        data: history.map((x) => x.ram),
                        borderColor: "rgba(255, 159, 64, 1)",
                        backgroundColor: (ctx) => {
                          const g = ctx.chart.ctx.createLinearGradient(
                            0,
                            0,
                            0,
                            300
                          );
                          g.addColorStop(0, "rgba(255, 159, 64, 0.4)");
                          g.addColorStop(1, "rgba(255, 159, 64, 0)");
                          return g;
                        },
                        pointRadius: 4,
                        borderWidth: 2,
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

        {/* RIGHT: TIMELINE */}
        <Col md={4}>
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            {/* FIXED HEADER */}
            <div
              className="px-3 py-3 border-bottom bg-white fw-bold text-primary d-flex justify-content-between align-items-center"
              style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <span>Activity History</span>

              <button
                className="btn btn-light border px-2 py-1 rounded-3"
                onClick={toggleSort}
                title="Sort">
                {sortAsc ? (
                  <FaSortAmountUp className="text-primary" />
                ) : (
                  <FaSortAmountDown className="text-primary" />
                )}
              </button>
            </div>

            {/* SEARCH */}
            <div className="px-3 pt-3 d-flex align-items-center gap-2">
              <FaSearch className="text-muted" />
              <Form.Control
                size="sm"
                placeholder="Cari status / CPU / RAM / tanggal..."
                value={timelineSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="rounded-3"
              />
            </div>

            {/* SCROLL LIST */}
            <Card.Body style={{ maxHeight: "360px", overflowY: "auto" }}>
              {timeline.length === 0 ? (
                <p className="text-center text-muted mt-3">Tidak ada data.</p>
              ) : (
                <ul className="timeline list-unstyled">
                  {timeline.map((item, idx) => (
                    <li key={idx} className="mb-3 d-flex">
                      <FaClock className="text-primary me-2 mt-1" />
                      <div>
                        <strong className="text-dark">
                          {new Date(item.timestamp).toLocaleString()}
                        </strong>
                        <div className="small">
                          Status:{" "}
                          <span
                            className={
                              item.backend === "healthy"
                                ? "text-success fw-bold"
                                : item.backend === "degraded"
                                ? "text-warning fw-bold"
                                : "text-danger fw-bold"
                            }>
                            {item.backend}
                          </span>
                        </div>
                        <div className="small text-muted">
                          CPU: {item.cpu_usage}% · RAM: {item.ram_usage}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* TECH */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Body>
          <h5 className="fw-bold text-primary mb-3">
            Teknologi yang Digunakan
          </h5>
          <Row className="g-3">
            {[
              { title: "Frontend", tech: "ReactJS + Bootstrap 5" },
              { title: "Backend", tech: "Python FastAPI" },
              { title: "Machine Learning", tech: "Facebook Prophet" },
              { title: "Database", tech: "MySQL" },
              { title: "Server", tech: "VPS AlmaLinux + Apache + cPanel" },
              { title: "Deployment", tech: "Gunicorn + Systemd" },
            ].map((item, idx) => (
              <Col md={4} sm={6} key={idx}>
                <Card className="border-0 bg-light rounded-4 p-3 h-100">
                  <h6 className="fw-bold text-dark mb-1">{item.title}</h6>
                  <p className="text-muted mb-0">{item.tech}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <footer className="mt-5 text-center text-muted small">
        <p className="mb-0">© {new Date().getFullYear()} AirQ — abiila</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
