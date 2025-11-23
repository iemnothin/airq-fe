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

  // Activity Log
  const [activityLog, setActivityLog] = useState([]);
  const [activityLimit, setActivityLimit] = useState(10);
  const [activityFilter, setActivityFilter] = useState("all");
  const [highlightActivityId, setHighlightActivityId] = useState(null);

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

  // ====== FETCH ======
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
    } catch {}
  };

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

      // ⭐ NEW — highlight when new activity appears
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

  // RESOURCE LOG
  const filteredTimeline = timeline
    .filter((item) =>
      searchDate
        ? new Date(item.timestamp).toISOString().slice(0, 10) === searchDate
        : true
    )
    .slice(0, showLimit);

  // ACTIVITY LOG
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

  // ⭐ wrapper classes — sesuai CSS optimasi
  return (
    <div className="container-fluid dashboard-root animate__animated animate__fadeIn">
      {/* STATUS CARDS */}
      {/* (tidak diubah — tetap pakai Row 6 kolom) */}
      {/* .... */}

      {/* ⭐ ROW BESAR — sesuai CSS baru */}
      <div className="dashboard-wrapper mt-3">
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
                          borderWidth: 2,
                          tension: 0.35,
                        },
                        {
                          label: "RAM (%)",
                          data: chartHistory.map((x) => x.ram),
                          borderWidth: 2,
                          tension: 0.35,
                        },
                      ],
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                ) : (
                  <Spinner />
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ⭐ SIDE PANELS */}
        <div className="side-panels">
          {/* RESOURCE LOG */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-2">Resource Log</h6>
              <div className="activity-log-wrapper">
                {filteredTimeline.map((item, idx) => (
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

          {/* ACTIVITY LOG */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-1">Activity Log</h6>
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

              <div className="activity-log-wrapper">
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

      <footer className="text-center text-muted small mt-3">
        © {new Date().getFullYear()} AirQ — abiila
      </footer>
    </div>
  );
};

export default DashboardPage;
