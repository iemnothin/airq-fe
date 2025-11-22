import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";

const DashboardPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [latency, setLatency] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

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
    } catch (error) {
      console.error("Gagal memuat status sistem:", error);
      setStatus(null);
      setAlertMsg("❌ API tidak dapat dihubungi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(
      fetchStatus,
      status?.backend === "degraded" ? 5000 : 10000
    );
    return () => clearInterval(interval);
  }, [status?.backend]);

  const getStatusStyle = (color) => ({
    borderRadius: "12px",
    padding: "6px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
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
    <div className="container py-4 animate__animated animate__fadeIn">
      {/* ALERT */}
      {alertMsg && (
        <div className="alert alert-danger text-center fw-bold rounded-4 py-2 animate__animated animate__shakeX">
          {alertMsg}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-4 text-center text-md-start">
        <h2 className="fw-bold text-success mb-1">Dashboard Sistem AirQ</h2>
        <p className="text-muted mb-0">
          Ringkasan status sistem dan teknologi yang digunakan.
        </p>
      </div>

      {/* STATUS SYSTEM */}
      <Card className="mb-4 shadow-sm border-0 rounded-4">
        <Card.Body>
          <h5 className="fw-bold text-primary mb-3">Status Sistem</h5>

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
            <Row className="g-4">
              {/* BACKEND */}
              <Col md={4} sm={6}>
                <Card className="border-0 rounded-4 shadow-sm h-100 text-center p-3">
                  <h6 className="fw-bold text-dark mb-2">Backend</h6>
                  <span style={getStatusStyle(backendUI.color)}>
                    {backendUI.icon} {backendUI.label}
                  </span>
                  <p className="small text-muted mt-2 mb-0">
                    CPU {status.cpu_usage} · RAM {status.ram_usage} · Latency{" "}
                    {latency} ms
                  </p>
                </Card>
              </Col>

              {/* DATABASE */}
              <Col md={4} sm={6}>
                <Card className="border-0 rounded-4 shadow-sm h-100 text-center p-3">
                  <h6 className="fw-bold text-dark mb-2">Database</h6>
                  <span
                    style={getStatusStyle(
                      status.database === "connected" ? "#28a745" : "#dc3545"
                    )}>
                    {status.database === "connected"
                      ? "Connected"
                      : "Disconnected"}
                  </span>
                </Card>
              </Col>

              {/* MODEL */}
              <Col md={4} sm={6}>
                <Card className="border-0 rounded-4 shadow-sm h-100 text-center p-3">
                  <h6 className="fw-bold text-dark mb-2">Model</h6>
                  <span
                    style={getStatusStyle(
                      status.model_status === "ready" ? "#28a745" : "#dc3545"
                    )}>
                    {status.model_status === "ready" ? "Ready" : "Not Ready"}
                  </span>
                </Card>
              </Col>

              {/* FRONTEND */}
              <Col md={4} sm={6}>
                <Card className="border-0 rounded-4 shadow-sm h-100 text-center p-3 bg-light">
                  <h6 className="fw-bold text-dark mb-2">Frontend</h6>
                  <span style={getStatusStyle("#28a745")}>Online</span>
                </Card>
              </Col>

              {/* WEB SERVER */}
              <Col md={4} sm={6}>
                <Card className="border-0 rounded-4 shadow-sm h-100 text-center p-3 bg-light">
                  <h6 className="fw-bold text-dark mb-2">Web Server</h6>
                  <span style={getStatusStyle("#28a745")}>Active</span>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* CHART CPU & RAM */}
      {history.length > 0 && (
        <Card className="mb-4 shadow-sm border-0 rounded-4">
          <Card.Body>
            <h5 className="fw-bold text-primary mb-3">
              Resource Monitoring (Realtime)
            </h5>
            <Line
              data={{
                labels: history.map((x) => x.time),
                datasets: [
                  {
                    label: "CPU (%)",
                    data: history.map((x) => x.cpu),
                    borderWidth: 2,
                    tension: 0.4,
                  },
                  {
                    label: "RAM (%)",
                    data: history.map((x) => x.ram),
                    borderWidth: 2,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: true } },
                scales: { y: { min: 0, max: 100 } },
              }}
              height={90}
            />
          </Card.Body>
        </Card>
      )}

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

      {/* FOOTER */}
      <footer className="mt-5 text-center text-muted small">
        <p className="mb-0">© {new Date().getFullYear()} AirQ — abiila</p>
      </footer>
    </div>
  );
};

export default DashboardPage;
