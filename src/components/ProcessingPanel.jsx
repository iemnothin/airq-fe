const ProcessingPanel = ({
  API_BASE,
  setIsProcessing,
  setForecastProgress,
  setForecastMessage,
  setCurrentPollutant,
  onDone,
}) => {
  const callEndpoint = async (path) => {
    if (setIsProcessing) setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}${path}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Server error");

      setForecastMessage(
        data?.message || "✅ Forecast completed successfully."
      );
      setForecastProgress(100);

      setTimeout(() => {
        setIsProcessing(false);

        if (onDone) onDone("basic");
      }, 1000);
    } catch (err) {
      console.error(err);
      setForecastMessage(err.message || "❌ Forecast failed.");

      setTimeout(() => {
        setIsProcessing(false);
        if (onDone) onDone(null);
      }, 1000);
    }
  };

  const handleAdvancedForecast = () => {
    if (setIsProcessing) setIsProcessing(true);
    setForecastMessage("🔄 Starting advanced forecast...");
    setForecastProgress(0);
    setCurrentPollutant("");

    const evtSource = new EventSource(`${API_BASE}/model/process-advanced`);

    window.currentForecastStream = evtSource;

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "start") {
        setForecastMessage(data.message);
        setForecastProgress(0);
      } else if (data.status === "processing") {
        setCurrentPollutant(data.pollutant);
        setForecastMessage(`Processing ${data.pollutant}`);
        setForecastProgress(data.progress);
      } else if (data.status === "done") {
        setForecastMessage(`Completed ${data.pollutant}`);
        setForecastProgress(data.progress);
      } else if (data.status === "complete") {
        setForecastProgress(100);
        setForecastMessage("🎉 All advanced forecasts completed!");

        evtSource.close();
        window.currentForecastStream = null;

        setTimeout(() => {
          setIsProcessing(false);
          if (onDone) onDone("advanced");
        }, 1000);
      }
    };

    evtSource.onerror = () => {
      setForecastMessage("❌ Connection lost or backend stopped.");
      setIsProcessing(false);

      evtSource.close();
      window.currentForecastStream = null;
    };
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <button
        className="btn btn-sketch-primary btn-sm d-flex align-items-center gap-2"
        onClick={() => callEndpoint("/model/process-basic")}
        title="Train model basic">
        <i className="fas fa-magic" />
        Process Basic
      </button>

      <button
        className="btn btn-sketch-secondary btn-sm d-flex align-items-center gap-2"
        onClick={handleAdvancedForecast}
        title="Train model with holiday, seasonality and tuning">
        <i className="fas fa-cogs" />
        Process With Parameters
      </button>
    </div>
  );
};

export default ProcessingPanel;
