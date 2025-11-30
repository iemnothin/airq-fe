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
import ConfirmModal from "../components/ConfirmModal";

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
  const [confirmRestart, setConfirmRestart] = useState(false);

  const [activityLog, setActivityLog] = useState([]);
  const [activityLimit, setActivityLimit] = useState(10);
  const [activityFilter, setActivityFilter] = useState("all");
  const [highlightActivityId, setHighlightActivityId] = useState(null);

  const [showLimit, setShowLimit] = useState(10);
  const [mobileTab, setMobileTab] = useState("status"); 

  const [techModal, setTechModal] = useState({
    show: false,
    title: "",
    tech: "",
  });

  const toWIB = (ts) => {
    const d = new Date(ts);
    d.setHours(d.getHours() + 7);
    return d.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const fetchStatus = async () => {
    const start = performance.now();
    try {
      // const res = await fetch("https://api-airq.abiila.com/api/v1/status");
      const res = await fetch("http://127.0.0.1:8000/api/v1/status");
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
      setAlertMsg("⚠ API tidak dapat dihubungi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      // const res = await fetch(
      //   "https://api-airq.abiila.com/api/v1/status/history"
      // );
      const res = await fetch("http://127.0.0.1:8000/api/v1/status/history");
      const data = await res.json();
      const sorted = [...(data.history || [])].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTimeline(sorted);
    } catch {}
  };

  const fetchActivityLog = async () => {
    try {
      // const res = await fetch(
      //   "https://api-airq.abiila.com/api/v1/activity-log"
      // );
      const res = await fetch("http://127.0.0.1:8000/api/v1/activity-log");
      const data = await res.json();
      const logs = Array.isArray(data.log) ? data.log : [];
      const sorted = [...logs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      if (sorted.length > 0 && sorted[0].id !== activityLog[0]?.id) {
        setHighlightActivityId(sorted[0].id);
        setTimeout(() => setHighlightActivityId(null), 2000);
      }
      setActivityLog(sorted);
    } catch {}
  };

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

  const restartBackend = async () => {
    setRestarting(true);
    try {
      // await fetch("https://api-airq.abiila.com/api/v1/status/restart", {
      //   method: "POST",
      //   headers: { admin_key: "AirQ-Admin-2025" },
      // });
      await fetch("http://127.0.0.1:8000/api/v1/status/restart", {
        method: "POST",
        headers: { admin_key: "AirQ-Admin-2025" },
      });
      setRestartMsg({ type: "success", text: "Backend berhasil direstart!" });
      setTimeout(fetchStatus, 5000);
    } catch {
      setRestartMsg({ type: "danger", text: "⚠ Gagal restart backend!" });
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
    .slice(0, showLimit);

  const getEventType = (event = "") => {
    const l = event.toLowerCase();
    if (l.includes("upload")) return "upload";
    if (l.includes("delete")) return "delete";
    if (l.includes("forecast")) return "forecast";
    if (l.includes("outlier")) return "outlier";
    return "other";
  };

  const filteredActivityLog =
    activityFilter === "all"
      ? activityLog
      : activityLog.filter(
          (item) => getEventType(item.event) === activityFilter
        );

  const slicedActivityLog = filteredActivityLog.slice(0, activityLimit);

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
    <div className="dashboard-root animate__animated animate__fadeIn">
      <div className="container-fluid py-2">
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

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
          <div className="mb-3">
            <h4 className="fw-bold text-dark mb-1">AirQ System Monitoring</h4>
            <small className="text-muted">
              Realtime monitoring of system status, resource logs, and model
              activities.
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
              onClick={() => setConfirmRestart(true)}
              disabled={restarting}>
              {restarting ? (
                <Spinner size="sm" />
              ) : (
                <FaSyncAlt className="me-2" />
              )}
              Restart Backend
            </button>
          </div>
        </div>

        <div className="d-none d-lg-block">
          <Row className="g-3 mb-3">
            {[
              ["Backend", backendUI.color, backendUI.icon, backendUI.label],
              [
                "Database",
                status?.database === "connected" ? "#28a745" : "#dc3545",
                status?.database === "connected" ? (
                  <FaCheckCircle />
                ) : (
                  <FaTimesCircle />
                ),
                status?.database === "connected" ? "Connected" : "Disconnected",
              ],
              [
                "Model",
                status?.model_status === "ready" ? "#28a745" : "#dc3545",
                status?.model_status === "ready" ? (
                  <FaCheckCircle />
                ) : (
                  <FaTimesCircle />
                ),
                status?.model_status === "ready" ? "Ready" : "Not Ready",
              ],
              ["Frontend", "#0d6efd", null, "ReactJS"],
              ["Server", "#6610f2", null, "VPS AlmaLinux"],
              ["Deployment", "#20c997", null, "Gunicorn"],
            ].map(([title, bg, icon, label], i) => (
              <Col lg={2} key={i}>
                <Card
                  className="status-card p-3 shadow-sm border-0 rounded-4 h-100"
                  onClick={() =>
                    setTechModal({
                      show: true,
                      title,
                      tech: label,
                    })
                  }
                  style={{ cursor: "pointer" }}>
                  <div
                    className="mb-2 d-inline-flex align-items-center gap-2 px-2 py-1 rounded-2 text-white"
                    style={{ background: bg }}>
                    {icon} {label}
                  </div>
                  <h6 className="fw-bold text-dark small mb-0">{title}</h6>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-3">
            <Col lg={6}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-primary mb-0">
                      Resource Monitoring
                    </h6>
                    <small className="text-muted">
                      CPU & RAM (last {chartHistory.length} tick)
                    </small>
                  </div>

                  <div style={{ minHeight: "270px", height: "100%" }}>
                    {chartHistory.length === 0 ? (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <Spinner animation="border" />
                      </div>
                    ) : (
                      <Line
                        data={{
                          labels: chartHistory.map((x) => x.time),
                          datasets: [
                            {
                              label: "CPU (%)",
                              data: chartHistory.map((x) => x.cpu),
                              borderColor: "rgba(75,192,192,1)",
                              borderWidth: 2,
                              tension: 0.35,
                              pointRadius: 2,
                            },
                            {
                              label: "RAM (%)",
                              data: chartHistory.map((x) => x.ram),
                              borderColor: "rgba(255,159,64,1)",
                              borderWidth: 2,
                              tension: 0.35,
                              pointRadius: 2,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          scales: { y: { min: 0, max: 100 } },
                          plugins: {
                            legend: { display: true, position: "bottom" },
                          },
                        }}
                      />
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-primary mb-2">Resource Log</h6>
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
                    style={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 350px)",
                    }}>
                    {filteredTimeline.length === 0 ? (
                      <p className="text-center text-muted small mt-2">
                        Resource log tidak ditemukan.
                      </p>
                    ) : (
                      <ul className="timeline list-unstyled mt-1 mb-0">
                        {filteredTimeline.map((item, idx) => (
                          <li
                            key={idx}
                            className={`mb-2 pulse ${
                              item.backend === "healthy"
                                ? "timeline-green"
                                : item.backend === "degraded"
                                ? "timeline-yellow"
                                : "timeline-red"
                            }`}>
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
                        ))}
                      </ul>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* <Col lg={3}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="d-flex flex-column">
                  <h6 className="fw-bold text-primary mb-2">Activity Log</h6>

                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {[
                      "all",
                      "upload",
                      "delete",
                      "forecast",
                      "outlier",
                      "other",
                    ].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={
                          activityFilter === f ? "primary" : "outline-secondary"
                        }
                        className="rounded-5 py-0"
                        onClick={() => {
                          setActivityFilter(f);
                          setActivityLimit(10);
                        }}>
                        {f}
                      </Button>
                    ))}
                  </div>

                  <div
                    style={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 350px)",
                    }}>
                    {slicedActivityLog.map((item, idx) => (
                      <div
                        key={idx}
                        className={
                          "activity-log-item p-2 rounded-3 mb-2 " +
                          (highlightActivityId === item.id
                            ? "activity-new"
                            : "")
                        }>
                        <div className={`event ${getEventType(item.event)}`}>
                          {item.event}
                        </div>
                        {item.detail && (
                          <small className="text-muted">{item.detail}</small>
                        )}
                        <small className="text-muted">
                          {toWIB(item.timestamp)}
                        </small>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col> */}
            <Col lg={3}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="d-flex flex-column">
                  <h6 className="fw-bold text-primary mb-2">Activity Log</h6>

                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {[
                      "all",
                      "upload",
                      "delete",
                      "forecast",
                      "outlier",
                      "other",
                    ].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={
                          activityFilter === f ? "primary" : "outline-secondary"
                        }
                        className="rounded-5 py-0"
                        onClick={() => {
                          setActivityFilter(f);
                          setActivityLimit(10);
                        }}>
                        {f}
                      </Button>
                    ))}
                  </div>

                  <div
                    style={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 350px)",
                    }}>
                    {slicedActivityLog.length === 0 && (
                      <div className="alert alert-warning text-center py-2">
                        No activity data exist.
                      </div>
                    )}

                    {slicedActivityLog.map((item, idx) => (
                      <div
                        key={idx}
                        className={
                          "activity-log-item p-2 rounded-3 mb-2 " +
                          (highlightActivityId === item.id
                            ? "activity-new"
                            : "")
                        }>
                        <div className={`event ${getEventType(item.event)}`}>
                          {item.event}
                        </div>

                        {item.detail && (
                          <small className="text-muted">{item.detail}</small>
                        )}

                        <small className="text-muted">
                          {toWIB(item.timestamp)}
                        </small>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="d-lg-none">
          <div className="d-md-none mt-3 mb-3">
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body className="p-3">
                <h6 className="fw-bold text-primary mb-2 text-center">
                  Resource Monitoring
                </h6>

                <div style={{ height: "240px" }}>
                  {chartHistory.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" />
                    </div>
                  ) : (
                    <Line
                      data={{
                        labels: chartHistory.map((x) => x.time),
                        datasets: [
                          {
                            label: "CPU (%)",
                            data: chartHistory.map((x) => x.cpu),
                            borderColor: "rgba(75,192,192,1)",
                            borderWidth: 2,
                            tension: 0.35,
                            pointRadius: 2,
                          },
                          {
                            label: "RAM (%)",
                            data: chartHistory.map((x) => x.ram),
                            borderColor: "rgba(255,159,64,1)",
                            borderWidth: 2,
                            tension: 0.35,
                            pointRadius: 2,
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        scales: { y: { min: 0, max: 100 } },
                        plugins: {
                          legend: {
                            display: true,
                            position: "bottom",
                            labels: { boxWidth: 12, font: { size: 10 } },
                          },
                        },
                      }}
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="d-flex justify-content-around border-bottom pt-2 mb-3">
            {[
              { key: "status", label: "System Status" },
              { key: "resource", label: "Resource Log" },
              { key: "activity", label: "Activity Log" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm fw-bold ${
                  mobileTab === tab.key
                    ? "text-primary border-primary border-bottom"
                    : "text-secondary"
                }`}
                style={{ borderRadius: 0 }}
                onClick={() => setMobileTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {mobileTab === "status" && (
            <Row className="g-2">
              {[
                ["Backend", backendUI.color, backendUI.icon, backendUI.label],
                [
                  "Database",
                  status?.database === "connected" ? "#28a745" : "#dc3545",
                  status?.database === "connected" ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  ),
                  status?.database === "connected"
                    ? "Connected"
                    : "Disconnected",
                ],
                [
                  "Model",
                  status?.model_status === "ready" ? "#28a745" : "#dc3545",
                  status?.model_status === "ready" ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  ),
                  status?.model_status === "ready" ? "Ready" : "Not Ready",
                ],
                ["Frontend", "#0d6efd", null, "ReactJS"],
                [
                  "Server",
                  "#6610f2",
                  null,
                  "VPS AlmaLinux + Apache + CyberPanel",
                ],
                ["Deployment", "#20c997", null, "Gunicorn"],
              ].map(([title, bg, icon, label], i) => (
                <Col xs={6} key={i}>
                  <Card
                    className="p-2 shadow-sm border-0 rounded-4 h-100"
                    onClick={() =>
                      setTechModal({
                        show: true,
                        title,
                        tech: label,
                      })
                    }
                    style={{ cursor: "pointer" }}>
                    <div
                      className="mb-2 d-inline-flex align-items-center gap-2 px-2 py-1 rounded-2 text-white small"
                      style={{ background: bg }}>
                      {icon} {label}
                    </div>
                    <div className="fw-bold small">{title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {mobileTab === "resource" && (
            <div style={{ maxHeight: "30vh", overflowY: "auto" }}>
              {filteredTimeline.length === 0 ? (
                <p className="text-center text-muted mt-2">
                  Resource log tidak ditemukan
                </p>
              ) : (
                <ul className="timeline list-unstyled mt-1 mb-0">
                  {filteredTimeline.map((item, idx) => (
                    <li
                      key={idx}
                      className={`mb-2 pulse ${
                        item.backend === "healthy"
                          ? "timeline-green"
                          : item.backend === "degraded"
                          ? "timeline-yellow"
                          : "timeline-red"
                      }`}>
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
                  ))}
                </ul>
              )}
            </div>
          )}

          {mobileTab === "activity" && (
            <div style={{ maxHeight: "30vh", overflowY: "auto" }}>
              {slicedActivityLog.length === 0 && (
                <div className="alert alert-warning text-center py-2">
                  No activity data exist.
                </div>
              )}

              {slicedActivityLog.map((item, idx) => (
                <div
                  key={idx}
                  className={
                    "activity-log-item p-2 rounded-3 mb-2 " +
                    (highlightActivityId === item.id ? "activity-new" : "")
                  }>
                  <div className={`event ${getEventType(item.event)}`}>
                    {item.event}
                  </div>

                  {item.detail && (
                    <small className="text-muted">{item.detail}</small>
                  )}

                  <small className="text-muted">{toWIB(item.timestamp)}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="text-center text-muted small mt-4 mb-2">
          © {new Date().getFullYear()} AirQ — abiila
        </footer>
      </div>

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

      <ConfirmModal
        show={confirmRestart}
        title="⚠ Restart Backend FastAPI"
        message="Are you sure to restart backend? This will temporarily make the API unavailable."
        confirmText="Restart"
        cancelText="Cancel"
        loading={restarting}
        confirmBtnClass="btn-danger"
        onClose={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false);
          restartBackend();
        }}
      />
    </div>
  );
};

export default DashboardPage;
