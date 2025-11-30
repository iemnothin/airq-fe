import { useState } from "react";

const useForecastActions = (API_BASE, refreshData) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [basicProcessed, setBasicProcessed] = useState(false);

  const processBasicForecast = async (pushSuccess, pushError) => {
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/model/process-basic`, {
        method: "POST",
      });

      const json = await res.json();

      if (res.ok) {
        await refreshData();
        setBasicProcessed(true);
        pushSuccess(json.message);
      } else {
        pushError("Processing failed");
      }
    } catch {
      pushError("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processBasicForecast,
    basicProcessed,
    setBasicProcessed,
    isProcessing,
  };
};

export default useForecastActions;
