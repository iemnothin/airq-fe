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
  FaSortAmountUp,
  FaSortAmountDown,
  FaClock,
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
  const [latency, setLatency] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [restartMsg, setRestartMsg] = useState(null);

  const [timeline, setTimeline] = useState([]);
  const [timelineBackup, setTimelineBackup] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const formatIndoTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const fetchStatus = async () => {
    const start = performance.now();
    try {
      const response = await fetch("https://api-airq.abiila.com/api/v1/status");
      const data = await response.json();
      const end = performance.now();
      setLatency((end - start).toFixed(0));
      setStatus(data);
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

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/status/history"
      );
      const json = await res.json();
      let list = json.history || [];

      // Default sort DESC (terbaru → teratas)
      list = list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setTimeline(list);
      setTimelineBackup(list);
    } catch {
      setTimeline([]);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const filterByDate = (date) => {
    setFilterDate(date);
    if (!date) return setTimeline(timelineBackup);

    const filtered = timelineBackup.filter((x) => x.timestamp.startsWith(date));
    setTimeline(filtered);
  };

  const toggleSort = () => {
    setSortAsc(!sortAsc);
    setTimeline((prev) =>
      [...prev].sort((a, b) =>
        sortAsc
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp)
      )
    );
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

  const statusMap = {
    healthy: { label: "Healthy", color: "#28a745", icon: <FaCheckCircle /> },
    degraded: {
      label: "Degraded",
      color: "#ffc107",
      icon: <FaExclamationTriangle />,
    },
    critical: { label: "Critical", color: "#dc3545", icon: <FaTimesCircle /> },
    unknown: { label: "Unknown", color: "#6c757d", icon: <FaInfoCircle /> },
  };

  const backendUI = statusMap[status?.backend] || statusMap.unknown;

  return (
    <div className="container py-4 animate__animated animate__fadeIn">
      {/* GLOBAL ALERT */}
      {alertMsg && (
        <div className="alert alert-danger fw-bold text-center rounded-4 py-2 animate__animated animate__shakeX">
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
          Monitoring realtime performa backend, database, dan resource sistem.
        </p>
      </div>

      <Row className="g-4">
        {/* LEFT SIDE — STATUS + CHART + TECH */}
        <Col lg={8}>
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
                      <FaSyncAlt className="me-2" /> Restart Backend
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
                        CPU {status.cpu_usage} · RAM {status.ram_usage} ·{" "}
                        {latency} ms
                      </p>
                    </Card>
                  </Col>

                  <Col md={4} sm={6}>
                    <Card className="shadow-sm border-0 rounded-4 p-4 text-center h-100">
                      <div
                        style={getStatusStyle(
                          status.database === "connected"
                            ? "#28a745"
                            : "#dc3545"
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
                          status.model_status === "ready"
                            ? "#28a745"
                            : "#dc3545"
                        )}
                        className="mx-auto">
                        {status.model_status === "ready" ? (
                          <FaCheckCircle />
                        ) : (
                          <FaTimesCircle />
                        )}{" "}
                        {status.model_status === "ready"
                          ? "Ready"
                          : "Not Ready"}
                      </div>
                      <h6 className="fw-bold text-dark mt-3 mb-2">Model</h6>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* CHART */}
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
                        pointRadius: 4,
                        borderWidth: 2,
                        tension: 0.35,
                      },
                      {
                        label: "RAM (%)",
                        data: history.map((x) => x.ram),
                        borderColor: "rgba(255, 159, 64, 1)",
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

          {/* TECHNOLOGY */}
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
        </Col>

        {/* RIGHT SIDE — TIMELINE */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <div
              className="bg-primary text-white fw-bold p-3"
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}>
              Sistem Activity Timeline
            </div>

            <div className="px-3 pt-3">
              <label className="small text-muted mb-1">Filter Tanggal</label>
              <input
                type="date"
                className="form-control form-control-sm rounded-3"
                value={filterDate}
                onChange={(e) => filterByDate(e.target.value)}
              />
            </div>

            <div className="px-3 mt-3 mb-2 d-flex justify-content-between align-items-center">
              <span className="small fw-semibold text-muted">
                Total {timeline.length} records
              </span>
              <button
                className="btn btn-light border px-2 py-1 rounded-3"
                onClick={toggleSort}>
                {sortAsc ? (
                  <FaSortAmountUp className="text-primary" />
                ) : (
                  <FaSortAmountDown className="text-primary" />
                )}
              </button>
            </div>

            <Card.Body style={{ maxHeight: "420px", overflowY: "auto" }}>
              {timeline.length === 0 ? (
                <p className="text-center text-muted mt-3">Tidak ada data.</p>
              ) : (
                <ul className="list-unstyled">
                  {timeline.map((item, idx) => (
                    <li key={idx} className="mb-3 d-flex">
                      <FaClock className="text-primary me-2 mt-1" />
                      <div>
                        <strong className="text-dark">
                          {formatIndoTime(item.timestamp)}
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

      <footer className="mt-5 text-center text-muted small">
        © {new Date().getFullYear()} AirQ — abiila
      </footer>
    </div>
  );
};

export default DashboardPage;
