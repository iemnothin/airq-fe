/* ==== ModelPage.jsx (FULL UPDATED WITH HANDLE OUTLIER FEATURE) ==== */

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/ModelPage.css";
import OutlierModal from "../components/OutlierModal";
import NoFileModal from "../components/NoFileModal";
import { fetchOutliers } from "../helpers/OutlierHelper";
import ProcessingPanel from "../components/ProcessingPanel";
import ConfirmModal from "../components/ConfirmModal";
import SuccessToast from "../components/SuccessToast";
import ErrorToast from "../components/ErrorToast";
import DragDropUpload from "../components/DragDropUpload";

const API_BASE = "https://api-airq.abiila.com/api/v1";

const ModelPage = ({ setError }) => {
  const [isClearingForecast, setIsClearingForecast] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  /* ⭐ NEW STATE (handling outlier) */
  const [isHandlingOutlier, setIsHandlingOutlier] = useState(false);
  const [showHandleOutlierConfirm, setShowHandleOutlierConfirm] =
    useState(false);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedData, setUploadedData] = useState([]);
  const [outliers, setOutliers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOutlierModal, setShowOutlierModal] = useState(false);
  const [showNoFileModal, setShowNoFileModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearForecastModal, setShowClearForecastModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSingleUpload, setShowSingleUpload] = useState(false);
  const [forecastProgress, setForecastProgress] = useState(0);
  const [forecastMessage, setForecastMessage] = useState("");
  const [currentPollutant, setCurrentPollutant] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [info, setInfo] = useState({
    totalData: 0,
    outlierClear: true,
    nanClear: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const customHeaderMap = {
    waktu: "Waktu",
    pm10: "PM10",
    pm25: "PM25",
    so2: "SO2",
    co: "CO",
    no2: "NO2",
    o3: "O3",
    hc: "HC",
    kelembaban: "Kelembaban",
    suhu: "Suhu",
  };

  /* 🔥 LOG ACTIVITY */
  const sendActivityLog = async (event, detail = "") => {
    try {
      await fetch(`${API_BASE}/activity-log/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, detail }),
      });
    } catch {}
  };

  /* FETCH DATA */
  const fetchUploadedData = async () => {
    try {
      const resData = await fetch(`${API_BASE}/data`);
      const data = await resData.json();
      setUploadedData(Array.isArray(data.data) ? data.data : []);

      const resInfo = await fetch(`${API_BASE}/data/info`);
      const infoData = await resInfo.json();
      setInfo(infoData);
    } catch {
      setUploadedData([]);
    }
  };

  useEffect(() => {
    fetchUploadedData();
  }, [setError]);

  useEffect(() => {
    const getOutliers = async () => {
      const data = await fetchOutliers(API_BASE);
      setOutliers(data);
    };
    getOutliers();
  }, []);

  const filteredData = uploadedData.filter((row) => {
    if (!searchDate) return true;
    const tanggalRow = new Date(row.waktu).toISOString().split("T")[0];
    return tanggalRow === searchDate;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexFirst = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredData.slice(indexFirst, indexFirst + rowsPerPage);

  /* 🔍 Outlier Modal Open */
  const handleOutlierClick = async () => {
    const data = await fetchOutliers(API_BASE);
    setOutliers(data);
    setShowOutlierModal(true);
  };

  /* ⭐ NEW — HANDLE OUTLIER EXECUTION */
  const executeHandleOutlier = async () => {
    setIsHandlingOutlier(true);
    try {
      const res = await fetch(`${API_BASE}/data/outliers-handle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal handle outlier");

      const result = await res.json();
      setShowHandleOutlierConfirm(false);

      await fetchUploadedData();
      const newOutliers = await fetchOutliers(API_BASE);
      setOutliers(newOutliers);

      setToastMessage(result.message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      /* Log */
      sendActivityLog("Handle Outlier", result.message);
    } catch {
      setErrorMessage("❌ Gagal menangani outlier!");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsHandlingOutlier(false);
    }
  };

  /* Delete All Data */
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await fetch(`${API_BASE}/data/delete-all`, { method: "DELETE" });
      await fetchUploadedData();
      setOutliers([]);
      setShowDeleteModal(false);
      setToastMessage("Semua data berhasil dihapus!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      sendActivityLog("Delete All Data", "Semua data dihapus");
    } catch {
      setErrorMessage("❌ Gagal menghapus data!");
      setShowErrorToast(true);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <>
      <SuccessToast show={showSuccessToast} text={toastMessage} />
      <ErrorToast show={showErrorToast} text={errorMessage} />

      {(isProcessing || isUploadingFile || isHandlingOutlier) && (
        <div className="loading-screen">
          <div
            className="spinner-border text-light"
            style={{ width: "4rem", height: "4rem" }}></div>
          <p className="mt-3 text-white fs-5 fw-semibold">
            {isHandlingOutlier
              ? "Handling Outliers..."
              : isProcessing
              ? "Processing model..."
              : "Uploading file..."}
          </p>
        </div>
      )}

      <div className="px-0 py-4 model-content-wrapper">
        <OutlierModal
          show={showOutlierModal}
          onClose={() => setShowOutlierModal(false)}
          outliers={outliers}
        />
        <NoFileModal
          show={showNoFileModal}
          onClose={() => setShowNoFileModal(false)}
        />

        <ConfirmModal
          show={showHandleOutlierConfirm}
          onClose={() => setShowHandleOutlierConfirm(false)}
          title="Handle Outlier Data"
          message="⚠️ Sistem akan mengganti nilai outlier dengan metode interpolasi. Lanjutkan?"
          confirmText="Ya, Lanjutkan"
          loading={isHandlingOutlier}
          onConfirm={executeHandleOutlier}
        />

        {/* ==== INFO CARDS ==== */}
        {uploadedData.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card bg-primary h-100">
                <div className="card-body d-flex gap-3 align-items-center">
                  <i className="fas fa-database fs-2"></i>
                  <div>
                    <h5 className="fw-bold">Jumlah Data</h5>
                    <p className="fs-5">{info.totalData}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* klik card outlier membuka modal */}
            <div className="col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.outlierCount === 0 ? "bg-success" : "bg-danger"
                }`}
                style={{ cursor: "pointer" }}
                onClick={handleOutlierClick}>
                <div className="card-body d-flex gap-3 align-items-center">
                  <i
                    className={`fas ${
                      info.outlierCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="fw-bold">Status Outlier</h5>
                    <p className="fs-5">
                      {info.outlierCount === 0
                        ? "Clear"
                        : `${info.outlierCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NaN Info */}
            <div className="col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.nanCount === 0 ? "bg-success" : "bg-warning"
                }`}>
                <div className="card-body d-flex gap-3 align-items-center">
                  <i
                    className={`fas ${
                      info.nanCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="fw-bold">Status NaN</h5>
                    <p className="fs-5">
                      {info.nanCount === 0 ? "Clear" : `${info.nanCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTION TOOLBAR ================= */}
        {uploadedData.length > 0 && (
          <div className="bg-white p-2 mb-3 shadow-sm rounded action-toolbar d-flex flex-wrap gap-2 justify-content-between align-items-center">
            {/* SEARCH DATE */}
            <div className="d-flex gap-2 align-items-center">
              <label className="fw-bold text-secondary mb-0">
                Search by Date:
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ maxWidth: "200px" }}
                value={searchDate}
                onChange={(e) => {
                  setSearchDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchDate && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSearchDate("")}>
                  Clear
                </button>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="d-flex gap-2 flex-wrap justify-content-end">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowSingleUpload(!showSingleUpload)}>
                <i
                  className={`fas ${
                    showSingleUpload ? "fa-times" : "fa-upload"
                  }`}></i>
                {showSingleUpload ? "Close" : "New Data"}
              </button>

              {/* ⭐ NEW — HANDLE OUTLIER BUTTON */}
              <button
                className="btn btn-warning btn-sm d-flex align-items-center gap-2"
                disabled={isHandlingOutlier || info.outlierCount === 0}
                onClick={() => setShowHandleOutlierConfirm(true)}>
                <i className="fas fa-wrench"></i>
                {isHandlingOutlier ? "Handling..." : "Handle Outlier"}
              </button>

              <ProcessingPanel
                API_BASE={API_BASE}
                setIsProcessing={setIsProcessing}
                setForecastProgress={setForecastProgress}
                setForecastMessage={setForecastMessage}
                setCurrentPollutant={setCurrentPollutant}
                onStart={() => setIsProcessing(true)}
                onDone={async (data) => {
                  setIsProcessing(false);
                  await fetchUploadedData();
                  setToastMessage(data.message);
                  setShowSuccessToast(true);
                  sendActivityLog("Forecast Process", data.message);
                }}
              />

              {/* Clear Forecast */}
              <button
                className="btn btn-danger btn-sm"
                disabled={isClearingForecast}
                onClick={() => setShowClearForecastModal(true)}>
                <i className="fas fa-trash-alt"></i> Clear Forecast
              </button>

              {/* Delete All Data */}
              <button
                className="btn btn-danger btn-sm"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteModal(true)}>
                <i className="fas fa-trash-alt"></i> Delete All
              </button>
            </div>
          </div>
        )}

        {/* ================= TABLE DISPLAY ================= */}
        {uploadedData.length > 0 ? (
          <div className="bg-white p-4 rounded shadow-sm">
            <h5 className="fw-bold text-center">
              Data Kualitas Udara Kota Bogor
            </h5>
            <p className="text-muted text-center" style={{ marginTop: "-6px" }}>
              Showing {filteredData.length} of {uploadedData.length} records
            </p>

            <div
              className="table-responsive border rounded shadow-sm mt-3"
              style={{ maxHeight: "500px" }}>
              <table className="table table-bordered table-striped">
                <thead className="table-success">
                  <tr>
                    <th>No</th>
                    {Object.keys(uploadedData[0])
                      .filter((k) => k !== "id")
                      .map((key) => (
                        <th key={key}>{customHeaderMap[key] || key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{indexFirst + idx + 1}</td>
                      {Object.entries(row)
                        .filter(([k]) => k !== "id")
                        .map(([key, val], i) => {
                          const isOutlier = outliers.some(
                            (o) =>
                              o.id === row.id &&
                              o.Kolom?.toLowerCase() === key.toLowerCase()
                          );
                          return (
                            <td
                              key={i}
                              className={
                                isOutlier ? "table-danger fw-bold" : ""
                              }>
                              {key === "waktu"
                                ? new Date(val).toLocaleString("id-ID")
                                : val ?? "-"}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-wrapper">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-select form-select-sm w-auto">
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              <ul className="pagination">
                <li
                  className={`page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => p - 1)}>
                    Prev
                  </button>
                </li>
                {[...Array(totalPages).keys()].map((x) => (
                  <li
                    key={x}
                    className={`page-item ${
                      currentPage === x + 1 ? "active" : ""
                    }`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(x + 1)}>
                      {x + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => p + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="alert alert-warning text-center">
              ⚠️ Belum ada data diupload.
            </div>
            <DragDropUpload
              apiBase={API_BASE}
              onStart={() => {
                setIsUploadingFile(true);
                setUploadProgress(0);
              }}
              onProgress={(p) => setUploadProgress(p)}
              onDone={async () => {
                setIsUploadingFile(false);
                await fetchUploadedData();
                const outlierData = await fetchOutliers(API_BASE);
                setOutliers(outlierData);
                setToastMessage("File berhasil diupload & dimuat!");
                setShowSuccessToast(true);
                sendActivityLog("Upload Data", "Upload file pertama");
              }}
              onError={(err) => {
                setIsUploadingFile(false);
                setErrorMessage(err?.message || "Upload failed");
                setShowErrorToast(true);
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ModelPage;
