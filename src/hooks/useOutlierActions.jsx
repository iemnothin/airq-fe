// src/hooks/useOutlierActions.js
import { useState } from "react";
import { fetchOutliers } from "../../helpers/OutlierHelper";

const useOutlierActions = (API_BASE, refreshData, setError) => {
  const [outliers, setOutliers] = useState([]);
  const [showOutlierModal, setShowOutlierModal] = useState(false);
  const [isHandlingOutlier, setIsHandlingOutlier] = useState(false);

  // open modal
  const openOutlierModal = async () => {
    try {
      const data = await fetchOutliers(API_BASE);
      setOutliers(data);
      setShowOutlierModal(true);
    } catch {
      setError("Failed to fetch outlier data.");
    }
  };

  // Handle outlier process
  const handleOutlierProcessing = async (pushSuccess, pushError) => {
    setIsHandlingOutlier(true);
    try {
      const res = await fetch(`${API_BASE}/data/outliers-handle`, {
        method: "POST",
      });

      const json = await res.json();
      await refreshData();

      const updated = await fetchOutliers(API_BASE);
      setOutliers(updated);

      pushSuccess(json.message);
    } catch {
      pushError("Failed to handle outlier!");
    } finally {
      setIsHandlingOutlier(false);
    }
  };

  return {
    outliers,
    setOutliers,
    showOutlierModal,
    openOutlierModal,
    isHandlingOutlier,
    handleOutlierProcessing,
  };
};

export default useOutlierActions;
