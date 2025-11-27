// src/hooks/useFileUpload.js
import { useState } from "react";

const useFileUpload = (API_BASE, refreshData, setOutliers) => {
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSingleUpload, setShowSingleUpload] = useState(false);

  const handleFileUpload = async (formData, pushSuccess, pushError) => {
    setIsUploadingFile(true);
    setUploadProgress(0);

    try {
      const res = await fetch(`${API_BASE}/upload-csv`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await refreshData();

      const outlierData = await fetch(`${API_BASE}/data/outliers`);
      const json = await outlierData.json();
      setOutliers(json.outliers || []);

      pushSuccess("File uploaded successfully!");
      setShowSingleUpload(false);
    } catch (err) {
      pushError(err.message || "Upload failed");
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(100);
    }
  };

  return {
    isUploadingFile,
    uploadProgress,
    showSingleUpload,
    setShowSingleUpload,
    handleFileUpload,
  };
};

export default useFileUpload;
