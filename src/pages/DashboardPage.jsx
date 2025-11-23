import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Button, Modal } from "react-bootstrap";
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
import "../css/DashboardPage.css";

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
  const [showLimit, setShowLimit] = useState(10);

  // Activity Log state
  const [activityLog, setActivityLog] = useState([]);
  const [activityLimit, setActivityLimit] = useState(10);

  // Modal Tech Stack
  const [techModal, setTechModal] = useState({
    show: false,
    title: "",
    tech: "",
  });

  // Helper: format ke WIB
  const toWIB = (ts) => {
    const d = new Date(ts);
    d.setHours(d.getHours() + 7);
    return d.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ====== FETCH SYSTEM STATUS ======
  const fetchStatus = async () => {
    const start = performance.now();
    try {
      const res = await fetch("https://api-airq.abiila.com/api/v1/status");
      const data = await res.json();
      const end = performance.now();

      setStatus(data);
      setLatency((end - start).toFixed(0));

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

  // ====== FETCH RESOURCE LOG (STATUS HISTORY) ======
  const fetchTimeline = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/status/history"
      );
      const data = await res.json();
      const sorted = [...(data.history || [])].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTimeline(sorted);
    } catch {
      // biarin silent, nanti UI tetap jalan
    }
  };

  // ====== FETCH ACTIVITY LOG (AKTIVITAS USER DI MODEL PAGE) ======
  const fetchActivityLog = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/activity-log"
      );
      const data = await res.json();

      // backend mengirim: { log: [...] }
      const logs = Array.isArray(data.log) ? data.log : [];

      const sorted = [...logs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setActivityLog(sorted);
    } catch {
      /* silent */
    }
  };

  // ====== EFFECT: POLLING STATUS + RESOURCE LOG + ACTIVITY LOG ======
  useEffect(() => {
    fetchStatus();
    fetchTimeline();
    fetchActivityLog();

    const interval = setInterval(
      () => {
        fetchStatus();
        fetchTimeline();
        fetchActivityLog();
      },
      status?.backend === "degraded" ? 5000 : 10000
    );
    return () => clearInterval(interval);
  }, [status?.backend]);

  // ====== RESTART BACKEND ======
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

  // Modal helper
  const openTech = (title, tech) => {
    setTechModal({ show: true, title, tech });
  };

  // ====== FILTER RESOURCE LOG (RESOURCE LOG = STATUS HISTORY) ======
  const filteredTimeline = timeline
    .filter((item) =>
      searchDate
        ? new Date(item.timestamp).toISOString().slice(0, 10) === searchDate
        : true
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, showLimit);

  // ====== ACTIVITY LOG: hanya slice di render, tanpa filter tanggal dulu ======
  const slicedActivityLog = activityLog.slice(0, activityLimit);

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
      {/* ALERTS */}
      {alertMsg && (
        <div className="alert alert-danger text-center fw-bold rounded-4 py-2 animate__shakeX">
          {alertMsg}
        </div>
      )}
      {restartMsg && (
        <div
          className={`alert alert-${restartMsg.type} text-center fw-bold rounded-4 py-2`}>
          {restartMsg.text}
        </div>
      )}

      {/* HEADER */}
      <div className="dashboard-header mb-4 text-center text-md-start">
        <h2 className="fw-bold text-success mb-1">Dashboard Sistem AirQ</h2>
        <p className="text-muted mb-0">
          Ringkasan status sistem, resource log, dan aktivitas model.
        </p>
      </div>

      {/* STATUS SYSTEM AND TECH STACK */}
      <Card className="mb-4 shadow-sm border-0 rounded-4">
        <Card.Body>
          <h5 className="fw-bold text-primary mb-3 text-center">
            Status Sistem dan Tech Stack
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
              {/* BACKEND */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() => openTech("Backend", "Python + FastAPI")}
                  style={{ cursor: "pointer" }}>
                  <div style={getStatusStyle(backendUI.color)}>
                    {backendUI.icon} {backendUI.label}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Backend</h6>
                </Card>
              </Col>

              {/* DATABASE */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() => openTech("Database", "MySQL")}
                  style={{ cursor: "pointer" }}>
                  <div
                    style={getStatusStyle(
                      status?.database === "connected" ? "#28a745" : "#dc3545"
                    )}>
                    {status?.database === "connected" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                    {status?.database === "connected"
                      ? "Connected"
                      : "Disconnected"}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Database</h6>
                </Card>
              </Col>

              {/* MODEL */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() => openTech("Model", "Facebook Prophet")}
                  style={{ cursor: "pointer" }}>
                  <div
                    style={getStatusStyle(
                      status?.model_status === "ready" ? "#28a745" : "#dc3545"
                    )}>
                    {status?.model_status === "ready" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                    {status?.model_status === "ready" ? "Ready" : "Not Ready"}
                  </div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Model</h6>
                </Card>
              </Col>

              {/* FRONTEND */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() => openTech("Frontend", "ReactJS")}
                  style={{ cursor: "pointer" }}>
                  <div style={getStatusStyle("#0d6efd")}>ReactJS</div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Frontend</h6>
                </Card>
              </Col>

              {/* SERVER */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() =>
                    openTech("Server", "VPS AlmaLinux + Apache + CyberPanel")
                  }
                  style={{ cursor: "pointer" }}>
                  <div style={getStatusStyle("#6610f2")}>Server</div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Server</h6>
                </Card>
              </Col>

              {/* DEPLOYMENT */}
              <Col md={4} sm={6}>
                <Card
                  className="status-card shadow-sm border-0 rounded-4 p-4 text-center h-100"
                  onClick={() => openTech("Deployment", "Gunicorn")}
                  style={{ cursor: "pointer" }}>
                  <div style={getStatusStyle("#20c997")}>Gunicorn</div>
                  <h6 className="fw-bold text-dark mt-3 mb-2">Deployment</h6>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* GRAPH + RESOURCE LOG */}
      <Row className="g-4">
        {/* GRAPH */}
        <Col md={8}>
          {chartHistory.length > 0 && (
            <Card className="shadow-sm border-0 rounded-4 h-100">
              <Card.Body>
                <h5 className="fw-bold text-primary mb-3 text-center">
                  Resource Monitoring (Realtime)
                </h5>
                <div style={{ height: "560px" }}>
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
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true } },
                      scales: { y: { min: 0, max: 100 } },
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* RESOURCE LOG (sebelumnya Activity Timeline) */}
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <div className="timeline-filter-header">
              <h5 className="fw-bold text-primary mb-2 text-center">
                Resource Log (24h)
              </h5>
              <input
                type="date"
                className="form-control rounded-4"
                value={searchDate}
                onChange={(e) => {
                  setSearchDate(e.target.value);
                  setShowLimit(10);
                }}
              />
            </div>

            <Card.Body className="timeline-sticky">
              {filteredTimeline.length === 0 ? (
                <p className="text-center text-muted mt-3">
                  Resource log tidak ditemukan.
                </p>
              ) : (
                <>
                  <ul className="timeline list-unstyled mt-2">
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

                  {showLimit < timeline.length && (
                    <div className="text-center mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="rounded-5 px-4 fw-bold"
                        onClick={() => setShowLimit(timeline.length)}>
                        Show More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ACTIVITY LOG (AKTIVITAS USER DARI MODEL PAGE) */}
      <Card className="shadow-sm border-0 rounded-4 mt-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold text-primary mb-0">Activity Log</h5>
            <small className="text-muted">
              Sumber aktivitas: halaman Model (upload, delete, forecast, dll)
            </small>
          </div>

          {slicedActivityLog.length === 0 ? (
            <p className="text-center text-muted mt-3">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <>
              <ul className="list-unstyled mt-3 mb-2">
                {slicedActivityLog.map((item, idx) => (
                  <li
                    key={item.id || idx}
                    className="mb-2 p-2 rounded-3 bg-light d-flex flex-column flex-md-row justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{item.event}</div>
                      {item.detail && (
                        <small className="text-muted d-block">
                          {item.detail}
                        </small>
                      )}
                    </div>
                    <small className="text-muted ms-md-3 mt-1 mt-md-0">
                      {toWIB(item.timestamp)}
                    </small>
                  </li>
                ))}
              </ul>

              {activityLimit < activityLog.length && (
                <div className="text-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="rounded-5 px-4 fw-bold"
                    onClick={() => setActivityLimit(activityLog.length)}>
                    Show More Activity
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* FOOTER */}
      <footer className="mt-5 text-center text-muted small">
        © {new Date().getFullYear()} AirQ — abiila
      </footer>

      {/* MODAL TECH STACK */}
      <Modal
        show={techModal.show}
        centered
        onHide={() => setTechModal({ ...techModal, show: false })}>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{techModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="fw-bold fs-5 mb-0">{techModal.tech}</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DashboardPage;
