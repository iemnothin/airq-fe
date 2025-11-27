// src/hooks/useModelData.js
import { useEffect, useState } from "react";

const useModelData = (API_BASE) => {
  const [uploadedData, setUploadedData] = useState([]);
  const [info, setInfo] = useState({
    totalData: 0,
    outlierClear: true,
    nanClear: true,
    outlierCount: 0,
    nanCount: 0,
  });
  const [searchDate, setSearchDate] = useState("");

  // Fetch data & info
  const refreshData = async () => {
    try {
      const resData = await fetch(`${API_BASE}/data`);
      const json = await resData.json();
      setUploadedData(json?.data || []);

      const resInfo = await fetch(`${API_BASE}/data/info`);
      const infoJson = await resInfo.json();
      setInfo(infoJson);
    } catch {
      setUploadedData([]);
    }
  };

  // First load
  useEffect(() => {
    refreshData();
  }, []);

  // Filter data by date
  const filteredData = uploadedData.filter((row) => {
    if (!searchDate) return true;
    return row.waktu.split("T")[0] === searchDate;
  });

  return {
    uploadedData,
    filteredData,
    info,
    searchDate,
    setSearchDate,
    refreshData,
  };
};

export default useModelData;
