const ProcessingPanel = ({
  API_BASE,
  setIsProcessing,
  setForecastProgress,
  setForecastMessage,
  setCurrentPollutant,
  onDone,
}) => {
  const callEndpoint = async (path) => {
    setIsProcessing(true);
    setForecastProgress(0);
    setForecastMessage("Starting basic forecast...");
    setCurrentPollutant("");

    try {
      const res = await fetch(`${API_BASE}${path}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Server error");

      let pct = 0;
      const timer = setInterval(() => {
        pct += 10;
        if (pct > 100) pct = 100;
        setForecastProgress(pct);

        if (pct === 100) {
          clearInterval(timer);
          setForecastMessage(data?.message || "Basic forecast completed!");
          setTimeout(() => {
            setIsProcessing(false);
            if (onDone) onDone("basic");
          }, 800);
        }
      }, 150);
    } catch (err) {
      setForecastMessage(err.message || "Basic forecast failed");
      setTimeout(() => {
        setIsProcessing(false);
        if (onDone) onDone(null);
      }, 800);
    }
  };

  const handleAdvancedForecast = () => {
    setIsProcessing(true);
    setForecastMessage("Starting advanced forecast...");
    setForecastProgress(0);
    setCurrentPollutant("");

    const evtSource = new EventSource(`${API_BASE}/model/process-advanced`);
    window.currentForecastStream = evtSource;

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "start") {
        setForecastMessage(data.message);
        setForecastProgress(0);
      }

      if (data.status === "processing") {
        setCurrentPollutant(data.pollutant);
        setForecastMessage(`Processing ${data.pollutant}...`);
        setForecastProgress(data.progress);
      }

      if (data.status === "done") {
        setForecastMessage(`Completed ${data.pollutant}`);
        setForecastProgress(data.progress);
      }

      if (data.status === "complete") {
        setForecastMessage("All advanced forecasts completed!");
        setForecastProgress(100);
        evtSource.close();
        window.currentForecastStream = null;

        setTimeout(() => {
          setIsProcessing(false);
          if (onDone) onDone("advanced");
        }, 800);
      }
    };

    evtSource.onerror = () => {
      setForecastMessage("Connection lost or backend stopped.");
      evtSource.close();
      setIsProcessing(false);
      window.currentForecastStream = null;
    };
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <button
        className="btn btn-sketch-primary btn-sm d-flex align-items-center gap-2"
        onClick={() => callEndpoint("/model/process-basic")}>
        <i className="fas fa-magic" />
        Train Basic
      </button>

      <button
        className="btn btn-sketch-secondary btn-sm d-flex align-items-center gap-2"
        onClick={handleAdvancedForecast}>
        <i className="fas fa-cogs" />
        Train Advanced
      </button>
    </div>
  );
};

export default ProcessingPanel;
