import { useEffect, useState, useCallback } from "react";
import { Card, Spinner, Button, Modal } from "react-bootstrap";
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

/* ==========================================================
   🔹 Helpers
========================================================== */
const toWIB = (ts) =>
  new Date(new Date(ts).getTime() + 7 * 3600 * 1000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const backendStatusMap = {
  healthy: { label: "Healthy", color: "#28a745", icon: <FaCheckCircle /> },
  degraded: {
    label: "Degraded",
    color: "#ffc107",
    icon: <FaExclamationTriangle />,
  },
  critical: { label: "Critical", color: "#dc3545", icon: <FaTimesCircle /> },
  unknown: { label: "Unknown", color: "#6c757d", icon: <FaInfoCircle /> },
};

const getEventType = (event = "") => {
  const l = event.toLowerCase();
  if (l.includes("upload")) return "upload";
  if (l.includes("delete")) return "delete";
  if (l.includes("forecast")) return "forecast";
  if (l.includes("outlier")) return "outlier";
  return "other";
};

/* ==========================================================
   🔹 Main Component
========================================================== */
export default function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [restartMsg, setRestartMsg] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [showLimit, setShowLimit] = useState(10);

  const [activityFilter, setActivityFilter] = useState("all");
  const [activityLimit, setActivityLimit] = useState(10);
  const [highlightActivityId, setHighlightActivityId] = useState(null);

  const [techModal, setTechModal] = useState({
    show: false,
    title: "",
    tech: "",
  });

  /* ==========================================================
     🔹 Fetch with useCallback
  ========================================================== */
  const fetchStatus = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch("https://api-airq.abiila.com/api/v1/status");
      const data = await res.json();
      setStatus(data);

      setLatency((performance.now() - start).toFixed(0));
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
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/status/history"
      );
      const data = await res.json();
      setTimeline(
        [...(data.history || [])].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )
      );
    } catch {}
  }, []);

  const fetchActivityLog = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api-airq.abiila.com/api/v1/activity-log"
      );
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
  }, [activityLog]);

  /* ==========================================================
     🔹 Polling
  ========================================================== */
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
  }, [status?.backend, fetchStatus, fetchTimeline, fetchActivityLog]);

  /* ==========================================================
     🔹 Restart
  ========================================================== */
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

  /* ==========================================================
     🔹 Derived values
  ========================================================== */
  const backendUI =
    backendStatusMap[status?.backend] || backendStatusMap.unknown;
  const filteredTimelineData = timeline
    .filter((x) =>
      searchDate
        ? new Date(x.timestamp).toISOString().slice(0, 10) === searchDate
        : true
    )
    .slice(0, showLimit);

  const filteredActivity =
    activityFilter === "all"
      ? activityLog
      : activityLog.filter(
          (item) => getEventType(item.event) === activityFilter
        );

  const slicedActivity = filteredActivity.slice(0, activityLimit);

  /* ==========================================================
     🔹 Render
  ========================================================== */
  return (
    <div className="container-fluid dashboard-root animate__animated animate__fadeIn">
      {/* Alerts */}
      {alertMsg && (
        <div className="alert alert-danger text-center">{alertMsg}</div>
      )}
      {restartMsg && (
        <div className={`alert alert-${restartMsg.type} text-center`}>
          {restartMsg.text}
        </div>
      )}

      {/* Header + Restart */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <div>
          <h4 className="fw-bold text-success mb-1">Dashboard Sistem AirQ</h4>
          <small className="text-muted">
            Status sistem, resource log, dan aktivitas model (Realtime)
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {latency && (
            <span className="badge bg-secondary">
              Latency API: {latency} ms
            </span>
          )}
          <Button
            variant="danger"
            size="sm"
            disabled={restarting}
            onClick={restartBackend}
            className="fw-bold rounded-4">
            {restarting ? (
              <Spinner size="sm" />
            ) : (
              <FaSyncAlt className="me-2" />
            )}
            Restart Backend
          </Button>
        </div>
      </div>

      {/* ---------------------- MAIN LAYOUT ---------------------- */}
      <div className="dashboard-wrapper">
        {/* GRAPH */}
        <div className="graph-container">
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-2">
                Resource Monitoring (Realtime)
              </h6>
              <div style={{ height: "100%" }}>
                {chartHistory.length > 0 ? (
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
                        },
                        {
                          label: "RAM (%)",
                          data: chartHistory.map((x) => x.ram),
                          borderColor: "rgba(255,159,64,1)",
                          borderWidth: 2,
                          tension: 0.35,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                      scales: { y: { min: 0, max: 100 } },
                    }}
                  />
                ) : (
                  <Spinner />
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* SIDE PANELS */}
        <div className="side-panels">
          {/* Resource Log */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-2">Resource Log</h6>
              <input
                type="date"
                className="form-control form-control-sm rounded-4 mb-2"
                value={searchDate}
                onChange={(e) => {
                  setSearchDate(e.target.value);
                  setShowLimit(10);
                }}
              />
              <div className="activity-log-wrapper">
                {filteredTimelineData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`pulse mb-2 ${
                      item.backend === "healthy"
                        ? "timeline-green"
                        : item.backend === "degraded"
                        ? "timeline-yellow"
                        : "timeline-red"
                    }`}>
                    <div className="fw-bold small">{toWIB(item.timestamp)}</div>
                    <small>
                      CPU {item.cpu_usage}% — RAM {item.ram_usage}%
                    </small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Activity Log */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-1">Activity Log</h6>

              {/* Filter buttons */}
              <div className="mb-2 d-flex flex-wrap gap-1">
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

              {/* Log Items */}
              <div className="activity-log-wrapper">
                {slicedActivity.map((item, idx) => (
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
                    <small className="text-muted">
                      {toWIB(item.timestamp)}
                    </small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted small mt-3">
        © {new Date().getFullYear()} AirQ — abiila
      </footer>

      {/* Modal Tech Stack */}
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
}
