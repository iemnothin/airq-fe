import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Button, Modal, Form } from "react-bootstrap";
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

  // Activity Log
  const [activityLog, setActivityLog] = useState([]);
  const [activityLimit, setActivityLimit] = useState(10);
  const [activityFilter, setActivityFilter] = useState("all");
  const [highlightActivityId, setHighlightActivityId] = useState(null);

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
      // silent
    }
  };

  // ====== FETCH ACTIVITY LOG (AKTIVITAS USER DI MODEL PAGE) ======
  const fetchActivityLog = async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/activity-log"
      );
      const data = await res.json();

      const logs = Array.isArray(data.log) ? data.log : [];
      const sorted = [...logs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      // cek apakah ada aktivitas baru (id teratas berubah)
      if (sorted.length > 0 && sorted[0].id !== activityLog[0]?.id) {
        setHighlightActivityId(sorted[0].id);
        setTimeout(() => setHighlightActivityId(null), 2500);
      }

      setActivityLog(sorted);
    } catch {
      // silent
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
  }, [status?.backend]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ====== FILTER RESOURCE LOG (STATUS HISTORY) ======
  const filteredTimeline = timeline
    .filter((item) =>
      searchDate
        ? new Date(item.timestamp).toISOString().slice(0, 10) === searchDate
        : true
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, showLimit);

  // ====== ACTIVITY LOG: filter by type + limit ======
  const getEventType = (event = "") => {
    const lower = event.toLowerCase();
    if (lower.includes("upload")) return "upload";
    if (lower.includes("delete")) return "delete";
    if (lower.includes("forecast")) return "forecast";
    if (lower.includes("outlier")) return "outlier";
    return "other";
  };

  const getEventStyle = (eventType) => {
    switch (eventType) {
      case "upload":
        return { badge: "primary", bgClass: "bg-upload" };
      case "delete":
        return { badge: "danger", bgClass: "bg-delete" };
      case "forecast":
        return { badge: "success", bgClass: "bg-forecast" };
      case "outlier":
        return { badge: "warning text-dark", bgClass: "bg-outlier" };
      default:
        return { badge: "secondary", bgClass: "bg-other" };
    }
  };

  const filteredActivityLog =
    activityFilter === "all"
      ? activityLog
      : activityLog.filter(
          (item) => getEventType(item.event) === activityFilter
        );

  const slicedActivityLog = filteredActivityLog.slice(0, activityLimit);

  const getStatusStyle = (color) => ({
    borderRadius: "12px",
    padding: "6px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    color: "white",
    fontSize: "0.9rem",
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
    <div
      className="dashboard-root animate__animated animate__fadeIn"
      style={{
        minHeight: "100vh",
        padding: "1rem 0.5rem",
      }}>
      <div className="container-fluid">
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

        {/* HEADER + RESTART */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
          <div className="mb-2 mb-md-0">
            <h4 className="fw-bold text-success mb-1">Dashboard Sistem AirQ</h4>
            <small className="text-muted">
              Status sistem, resource log, dan aktivitas model (Realtime).
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            {latency && (
              <span className="badge bg-secondary">
                Latency API: {latency} ms
              </span>
            )}
            <button
              className="btn btn-danger btn-sm px-3 rounded-4 fw-bold"
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
        </div>

        {/* ROW 1: STATUS CARDS */}
        <Row className="g-3 mb-3">
          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() => openTech("Backend", "Python + FastAPI")}
              style={{ cursor: "pointer" }}>
              <div className="mb-2" style={getStatusStyle(backendUI.color)}>
                {backendUI.icon} {backendUI.label}
              </div>
              <h6 className="fw-bold text-dark mb-0 small">Backend</h6>
            </Card>
          </Col>

          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() => openTech("Database", "MySQL")}
              style={{ cursor: "pointer" }}>
              <div
                className="mb-2"
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
              <h6 className="fw-bold text-dark mb-0 small">Database</h6>
            </Card>
          </Col>

          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() => openTech("Model", "Facebook Prophet")}
              style={{ cursor: "pointer" }}>
              <div
                className="mb-2"
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
              <h6 className="fw-bold text-dark mb-0 small">Model</h6>
            </Card>
          </Col>

          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() => openTech("Frontend", "ReactJS")}
              style={{ cursor: "pointer" }}>
              <div className="mb-2" style={getStatusStyle("#0d6efd")}>
                ReactJS
              </div>
              <h6 className="fw-bold text-dark mb-0 small">Frontend</h6>
            </Card>
          </Col>

          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() =>
                openTech("Server", "VPS AlmaLinux + Apache + CyberPanel")
              }
              style={{ cursor: "pointer" }}>
              <div className="mb-2" style={getStatusStyle("#6610f2")}>
                Server
              </div>
              <h6 className="fw-bold text-dark mb-0 small">Server</h6>
            </Card>
          </Col>

          <Col lg={2} md={4} sm={6} xs={6}>
            <Card
              className="status-card shadow-sm border-0 rounded-4 p-3 h-100"
              onClick={() => openTech("Deployment", "Gunicorn")}
              style={{ cursor: "pointer" }}>
              <div className="mb-2" style={getStatusStyle("#20c997")}>
                Gunicorn
              </div>
              <h6 className="fw-bold text-dark mb-0 small">Deployment</h6>
            </Card>
          </Col>
        </Row>

        {/* ROW 2: GRAPH + RESOURCE + ACTIVITY (satu layar desktop) */}
        <Row className="g-3" style={{ minHeight: "55vh" }}>
          {/* GRAPH */}
          <Col lg={6} md={12}>
            <Card className="shadow-sm border-0 rounded-4 h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-primary mb-0">
                    Resource Monitoring (Realtime)
                  </h6>
                  <small className="text-muted">
                    CPU & RAM (last {chartHistory.length} tick)
                  </small>
                </div>
                {chartHistory.length === 0 ? (
                  <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <div style={{ minHeight: "250px", height: "100%" }}>
                    <Line
                      data={{
                        labels: chartHistory.map((x) => x.time),
                        datasets: [
                          {
                            label: "CPU (%)",
                            data: chartHistory.map((x) => x.cpu),
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 2,
                            pointRadius: 2,
                            tension: 0.35,
                          },
                          {
                            label: "RAM (%)",
                            data: chartHistory.map((x) => x.ram),
                            borderColor: "rgba(255, 159, 64, 1)",
                            borderWidth: 2,
                            pointRadius: 2,
                            tension: 0.35,
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: "bottom" },
                        },
                        scales: { y: { min: 0, max: 100 } },
                      }}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* RESOURCE LOG */}
          <Col lg={3} md={6}>
            <Card className="shadow-sm border-0 rounded-4 h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-primary mb-0">Resource Log</h6>
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-4"
                    style={{ maxWidth: "140px" }}
                    value={searchDate}
                    onChange={(e) => {
                      setSearchDate(e.target.value);
                      setShowLimit(10);
                    }}
                  />
                </div>

                <div
                  className="flex-grow-1"
                  style={{ overflowY: "auto", maxHeight: "260px" }}>
                  {filteredTimeline.length === 0 ? (
                    <p className="text-center text-muted mt-2 small">
                      Resource log tidak ditemukan.
                    </p>
                  ) : (
                    <ul className="timeline list-unstyled mt-1 mb-0">
                      {filteredTimeline.map((item, idx) => {
                        const colorClass =
                          item.backend === "healthy"
                            ? "timeline-green"
                            : item.backend === "degraded"
                            ? "timeline-yellow"
                            : "timeline-red";

                        return (
                          <li key={idx} className={`mb-2 pulse ${colorClass}`}>
                            <div className="fw-bold small">
                              {toWIB(item.timestamp)}
                            </div>
                            <small className="text-muted">
                              CPU {item.cpu_usage}% — RAM {item.ram_usage}%
                            </small>
                            <div className="fw-bold text-uppercase small mt-1">
                              {item.backend}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {showLimit < timeline.length && (
                  <div className="text-center mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-5 px-3 fw-bold"
                      onClick={() => setShowLimit(timeline.length)}>
                      Show More
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* ACTIVITY LOG */}
          <Col lg={3} md={6}>
            <Card className="shadow-sm border-0 rounded-4 h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 className="fw-bold text-primary mb-0">Activity Log</h6>
                    <small className="text-muted">
                      ModelPage: upload, delete, forecast, outlier
                    </small>
                  </div>
                </div>

                {/* Filter event type */}
                <div className="mb-2 d-flex flex-wrap gap-1">
                  {[
                    { key: "all", label: "All" },
                    { key: "upload", label: "Upload" },
                    { key: "delete", label: "Delete" },
                    { key: "forecast", label: "Forecast" },
                    { key: "outlier", label: "Outlier" },
                    { key: "other", label: "Other" },
                  ].map((f) => (
                    <Button
                      key={f.key}
                      size="sm"
                      variant={
                        activityFilter === f.key
                          ? "primary"
                          : "outline-secondary"
                      }
                      className="rounded-5 px-2 py-0 small"
                      onClick={() => {
                        setActivityFilter(f.key);
                        setActivityLimit(10);
                      }}>
                      {f.label}
                    </Button>
                  ))}
                </div>

                <div
                  className="flex-grow-1"
                  style={{ overflowY: "auto", maxHeight: "260px" }}>
                  {slicedActivityLog.length === 0 ? (
                    <p className="text-center text-muted mt-2 small">
                      Belum ada aktivitas tercatat.
                    </p>
                  ) : (
                    <ul className="list-unstyled mt-1 mb-0">
                      {slicedActivityLog.map((item, idx) => {
                        const type = getEventType(item.event);
                        const { badge, bgClass } = getEventStyle(type);
                        const isHighlighted =
                          item.id === highlightActivityId && idx === 0;

                        return (
                          <li
                            key={item.id || idx}
                            className={
                              "mb-2 p-2 rounded-3 d-flex flex-column bg-light " +
                              bgClass +
                              (isHighlighted
                                ? " animate__animated animate__fadeInDown"
                                : "")
                            }>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <span className={`badge bg-${badge} me-1 mb-1`}>
                                  {item.event}
                                </span>
                                {item.detail && (
                                  <small className="text-muted d-block">
                                    {item.detail}
                                  </small>
                                )}
                              </div>
                              <small className="text-muted ms-2 mt-1 text-end">
                                {toWIB(item.timestamp)}
                              </small>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {activityLimit < filteredActivityLog.length && (
                  <div className="text-center mt-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="rounded-5 px-3 fw-bold"
                      onClick={() =>
                        setActivityLimit(filteredActivityLog.length)
                      }>
                      Show More Activity
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FOOTER (kecil supaya tidak makan tinggi) */}
        <footer className="mt-3 text-center text-muted small">
          © {new Date().getFullYear()} AirQ — abiila
        </footer>
      </div>

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
