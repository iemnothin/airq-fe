import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/ModelPage.css";
import OutlierModal from "../components/OutlierModal";
import NoFileModal from "../components/NoFileModal";
import { fetchOutliers, handleOutliers } from "../helpers/OutlierHelper";
import ProcessingPanel from "../components/ProcessingPanel";
import ConfirmModal from "../components/ConfirmModal";
import SuccessToast from "../components/SuccessToast";
import ErrorToast from "../components/ErrorToast";
import DragDropUpload from "../components/DragDropUpload";
import { useNavigate } from "react-router-dom";

// const API_BASE = "https://api-airq.abiila.com/api/v1";
const API_BASE = "http://127.0.0.1:8000/api/v1";

const ModelPage = ({ setError }) => {
  const [isClearingForecast, setIsClearingForecast] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isHandlingOutlier, setIsHandlingOutlier] = useState(false);
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [activityLog, setActivityLog] = useState([]);
  const [basicProcessed, setBasicProcessed] = useState(false);
  const [advancedProcessed, setAdvancedProcessed] = useState(false);
  const [advProgress, setAdvProgress] = useState({
    pollutant: "",
    percent: 0,
  });

  const navigate = useNavigate();

  const formatFullDate = (value) => {
    const date = new Date(value);

    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const month = monthNames[date.getMonth()];
    const dayName = dayNames[date.getDay()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
  };

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

  const sendActivityLog = async (event, detail = "") => {
    try {
      await fetch(`${API_BASE}/activity-log/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, detail }),
      });
    } catch {
      console.warn("Failed to send activity log");
    }
  };

  const fetchUploadedData = async () => {
    try {
      const resData = await fetch(`${API_BASE}/data`);
      if (!resData.ok) {
        setUploadedData([]);
        return;
      }

      const data = await resData.json();
      setUploadedData(Array.isArray(data.data) ? data.data : []);

      const resInfo = await fetch(`${API_BASE}/data/info`);
      if (!resInfo.ok) return;
      const infoData = await resInfo.json();

      setInfo({
        totalData: infoData.totalData,
        outlierClear: infoData.outlierClear,
        nanClear: infoData.nanClear,
        outlierCount: infoData.outlierCount ?? 0,
        nanCount: infoData.nanCount ?? 0,
      });
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

  useEffect(() => {
    const checkStatus = async () => {
      const basic = await fetch(`${API_BASE}/forecast/check-basic`).then((r) =>
        r.json()
      );
      const adv = await fetch(`${API_BASE}/forecast/check-advanced`).then((r) =>
        r.json()
      );

      setBasicProcessed(basic.exists);
      setAdvancedProcessed(adv.exists);
    };

    checkStatus();
  }, []);

  const filteredData = uploadedData.filter((row) => {
    if (!searchDate) return true;
    const tanggalRow = new Date(row.waktu).toISOString().split("T")[0];
    return tanggalRow === searchDate;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexFirst = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredData.slice(indexFirst, indexFirst + rowsPerPage);

  const getPageNumbers = () => {
    if (totalPages <= 5) return [...Array(totalPages).keys()].map((x) => x + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (currentPage >= totalPages - 2)
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const handleOutlierClick = async () => {
    try {
      const data = await fetchOutliers(API_BASE);
      setOutliers(data);
      setShowOutlierModal(true);
    } catch {
      setError("Failed to fetch outlier data.");
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch(`${API_BASE}/data/delete-all`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete data");

      await fetchUploadedData();
      setOutliers([]);
      setShowDeleteModal(false);

      setToastMessage("All data has been successfully deleted!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      sendActivityLog("Delete all data", "All data deleted by user at ");
    } catch {
      setErrorMessage("Failed to delete data!");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const runHandleOutlier = async () => {
    setIsHandlingOutlier(true);
    try {
      const res = await fetch(`${API_BASE}/data/outliers-handle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to handle outlier");
      const result = await res.json();

      await fetchUploadedData();
      const updatedOutliers = await fetchOutliers(API_BASE);
      setOutliers(updatedOutliers);

      setToastMessage(result.message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      await sendActivityLog("Handle Outlier", result.message, " at ");

      await refreshActivityLog();
    } catch {
      setErrorMessage("Failed to handle outlier!");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsHandlingOutlier(false);
    }
  };

  const refreshActivityLog = async () => {
    try {
      const res = await fetch(`${API_BASE}/activity-log`);
      const data = await res.json();
      if (data?.log && typeof setActivityLog === "function") {
        setActivityLog(data.log);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/forecast/progress`);
        if (!res.ok) return;

        const data = await res.json();

        setAdvProgress({
          pollutant: data.current,
          percent: data.percentage,
        });
      } catch (err) {
        console.warn("Failed to fetch progress");
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <div className="container-fluid model-page-root animate__animated animate__fadeIn">
      
      <SuccessToast show={showSuccessToast} text={toastMessage} />
      <ErrorToast show={showErrorToast} text={errorMessage} />

      <div className="mt-3 mb-3">
        <h4 className="fw-bold text-dark mb-1">Modelling</h4>
        <small className="text-muted">
          Please upload the dataset and execute the forecasting process using
          the Facebook Prophet model.
        </small>
      </div>
      
      {(isProcessing || isUploadingFile) && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 2000,
            backdropFilter: "blur(3px)",
          }}>
          <div
            className="spinner-border text-light"
            style={{ width: "4rem", height: "4rem" }}></div>
          <p className="mt-3 text-white fs-5 fw-semibold">
            {isProcessing ? "Processing model..." : "Uploading file..."}
          </p>

          {isUploadingFile && uploadProgress > 0 && (
            <div className="progress mt-2" style={{ width: "200px" }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100">
                {uploadProgress}%
              </div>
            </div>
          )}
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

        {/* {uploadedData.length > 0 && (
          <div className="row mb-4">
            <div className="col-12 col-md-4 mb-3">
              <div className="card bg-primary h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <i className="fas fa-database fs-2"></i>
                  <div>
                    <h5 className="card-title fw-bold">Total Data</h5>
                    <p className="card-text fs-5">{info.totalData}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.outlierCount === 0 ? "bg-success" : "bg-danger"
                }`}
                style={{ cursor: "pointer" }}
                onClick={handleOutlierClick}>
                <div className="card-body d-flex align-items-center gap-3">
                  <i
                    className={`fas ${
                      info.outlierCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="card-title fw-bold">Outlier</h5>
                    <p className="card-text fs-5">
                      {info.outlierCount === 0
                        ? "Clear"
                        : `${info.outlierCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.nanCount === 0 ? "bg-success" : "bg-warning"
                }`}>
                <div className="card-body d-flex align-items-center gap-3">
                  <i
                    className={`fas ${
                      info.nanCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="card-title fw-bold">NaN / Null</h5>
                    <p className="card-text fs-5">
                      {info.nanCount === 0 ? "Clear" : `${info.nanCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}
        {uploadedData.length > 0 && (
          <div className="row mb-4 d-none d-md-flex">
            <div className="col-12 col-md-4 mb-3">
              <div className="card bg-primary h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <i className="fas fa-database fs-2"></i>
                  <div>
                    <h5 className="card-title fw-bold">Total Data</h5>
                    <p className="card-text fs-5">{info.totalData}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.outlierCount === 0 ? "bg-success" : "bg-danger"
                }`}
                style={{ cursor: "pointer" }}
                onClick={handleOutlierClick}>
                <div className="card-body d-flex align-items-center gap-3">
                  <i
                    className={`fas ${
                      info.outlierCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="card-title fw-bold">Outlier</h5>
                    <p className="card-text fs-5">
                      {info.outlierCount === 0
                        ? "Clear"
                        : `${info.outlierCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 mb-3">
              <div
                className={`card h-100 text-white ${
                  info.nanCount === 0 ? "bg-success" : "bg-warning"
                }`}>
                <div className="card-body d-flex align-items-center gap-3">
                  <i
                    className={`fas ${
                      info.nanCount === 0
                        ? "fa-check-circle"
                        : "fa-exclamation-triangle"
                    } fs-2`}></i>
                  <div>
                    <h5 className="card-title fw-bold">NaN / Null</h5>
                    <p className="card-text fs-5">
                      {info.nanCount === 0 ? "Clear" : `${info.nanCount} data`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadedData.length > 0 && (
          <div className="mb-3">
            
            <div
              className="d-flex d-md-none gap-2 pb-2"
              style={{
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}>
              
              <style>
                {`
                  div::-webkit-scrollbar { display: none; }
                `}
              </style>

              {[
                {
                  title: "Total Data",
                  value: info.totalData,
                  icon: "fa-database",
                  bg: "bg-primary",
                  clickable: false,
                },
                {
                  title: "Outlier",
                  value:
                    info.outlierCount === 0
                      ? "Clear"
                      : `${info.outlierCount} data`,
                  icon:
                    info.outlierCount === 0
                      ? "fa-check-circle"
                      : "fa-exclamation-triangle",
                  bg: info.outlierCount === 0 ? "bg-success" : "bg-danger",
                  clickable: true,
                  onClick: handleOutlierClick,
                },
                {
                  title: "NaN / Null",
                  value:
                    info.nanCount === 0 ? "Clear" : `${info.nanCount} data`,
                  icon:
                    info.nanCount === 0
                      ? "fa-check-circle"
                      : "fa-exclamation-triangle",
                  bg: info.nanCount === 0 ? "bg-success" : "bg-warning",
                  clickable: false,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`card text-white rounded-4 shadow-sm flex-shrink-0 ${item.bg}`}
                  onClick={item.onClick}
                  style={{
                    width: "150px",
                    minHeight: "85px",
                    cursor: item.clickable ? "pointer" : "default",
                  }}>
                  <div className="card-body d-flex align-items-center gap-2 p-2">
                    <i className={`fas ${item.icon} fs-1`}></i>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "1.15rem" }}>
                        {item.title}
                      </div>
                      <div className="fw-semibold" style={{ fontSize: "1rem" }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row d-none d-md-flex g-2">
              <div className="col-md-4">{/* Total Data */}</div>
              <div className="col-md-4">{/* Outlier */}</div>
              <div className="col-md-4">{/* NAN */}</div>
            </div>
          </div>
        )}

        {uploadedData.length > 0 ? (
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="table-side">
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: showSingleUpload ? "500px" : "0px",
                  transition: "max-height 0.4s ease",
                }}>
                {showSingleUpload && (
                  <div className="mb-4">
                    <DragDropUpload
                      apiBase={API_BASE}
                      onStart={() => {
                        setIsUploadingFile(true);
                        setUploadProgress(0);
                      }}
                      onProgress={(p) => setUploadProgress(p)}
                      onDone={async (res) => {
                        setIsUploadingFile(false);
                        await fetchUploadedData();
                        const out = await fetchOutliers(API_BASE);
                        setOutliers(out);

                        setToastMessage("File uploaded successfully!");
                        setShowSuccessToast(true);
                        setTimeout(() => setShowSuccessToast(false), 3000);

                        const detail = uploadedData.length
                          ? `Additional upload: ${uploadedData.length} records by user at `
                          : "First file upload at ";
                        sendActivityLog("Upload Data", detail);
                      }}
                      onError={(err) => {
                        setIsUploadingFile(false);
                        setErrorMessage(err?.message || "Upload failed!");
                        setShowErrorToast(true);
                        setTimeout(() => setShowErrorToast(false), 4000);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="d-flex flex-column justify-content-center align-items-center mb-3">
                <h5 className="text-center fs-4 fw-bold">
                  Air Quality Data of Bogor City
                </h5>
                <small className="text-muted">
                  Showing {filteredData.length} of {uploadedData.length} records
                </small>
              </div>

              <div className="action-toolbar bg-white rounded p-2 mb-3 shadow-sm flex-wrap">
                <div className="search-toolbar d-flex flex-wrap align-items-center gap-2 mb-2 mb-md-0">
                  <label className="fw-bold text-secondary mb-0">
                    Search by Date:
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm flex-grow-1 w-auto"
                    value={searchDate}
                    onChange={(e) => {
                      setSearchDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ maxWidth: "200px" }}
                  />
                  {searchDate && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSearchDate("")}>
                      <i className="fas fa-times"></i> Clear
                    </button>
                  )}
                </div>

                {uploadedData.length > 0 && (
                  <div className="d-flex flex-wrap justify-content-center justify-content-md-end align-items-center gap-2 bg-sketch-secondary p-2 border rounded mobile-flex-stack w-100 w-md-auto">
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                      onClick={() => setShowSingleUpload(!showSingleUpload)}
                      title="Upload new data">
                      <i
                        className={`fas ${
                          showSingleUpload ? "fa-times" : "fa-upload"
                        }`}></i>
                      {showSingleUpload ? "Close" : "New Data"}
                    </button>

                    {(basicProcessed || advancedProcessed) && (
                      <button
                        className="btn btn-info btn-sm d-flex align-items-center gap-2"
                        onClick={() => navigate("/forecast/results")}>
                        <i className="fas fa-chart-line"></i>
                        View Forecast Result
                      </button>
                    )}

                    <ProcessingPanel
                      API_BASE={API_BASE}
                      setIsProcessing={setIsProcessing}
                      setForecastProgress={setForecastProgress}
                      setForecastMessage={setForecastMessage}
                      setCurrentPollutant={setCurrentPollutant}
                      // onDone={async (mode) => {
                      //   setIsProcessing(false);
                      //   await fetchUploadedData();

                      //   if (mode) {
                      //     setToastMessage(
                      //       mode === "basic"
                      //         ? "Basic forecast completed!"
                      //         : "Advanced forecast completed!"
                      //     );
                      //     setShowSuccessToast(true);

                      //     setTimeout(() => setShowSuccessToast(false), 1000);

                      //     if (mode === "basic") setBasicProcessed(true);
                      //     if (mode === "advanced") setAdvancedProcessed(true);
                      //   } else {
                      //     setErrorMessage("Processing failed");
                      //     setShowErrorToast(true);
                      //     setTimeout(() => setShowErrorToast(false), 4500);
                      //   }
                      // }}
                      onDone={async (mode) => {
                        setIsProcessing(false);
                        await fetchUploadedData();

                        if (mode) {
                          const isBasic = mode === "basic";

                          setToastMessage(
                            isBasic
                              ? "Basic forecast completed!"
                              : "Advanced forecast completed!"
                          );
                          setShowSuccessToast(true);
                          setTimeout(() => setShowSuccessToast(false), 1000);

                          if (isBasic) setBasicProcessed(true);
                          else setAdvancedProcessed(true);

                          await sendActivityLog(
                            isBasic ? "Basic Forecast" : "Advanced Forecast",
                            `${
                              isBasic ? "Basic" : "Advanced"
                            } forecast processed by user at `
                          );
                        } else {
                          setErrorMessage("Processing failed");
                          setShowErrorToast(true);
                          setTimeout(() => setShowErrorToast(false), 4500);
                        }
                      }}
                    />

                    <button
                      className="btn btn-warning btn-sm d-flex align-items-center gap-2"
                      disabled={info.outlierCount === 0 || isHandlingOutlier}
                      onClick={runHandleOutlier}>
                      <i className="fas fa-wrench"></i>
                      {isHandlingOutlier ? "Processing..." : "Handle Outlier"}
                    </button>

                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                      onClick={() => setShowClearForecastModal(true)}
                      disabled={isClearingForecast}>
                      <i className="fas fa-trash-alt"></i>
                      {isClearingForecast ? "Clearing..." : "Clear Forecast"}
                    </button>

                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeletingAll}>
                      <i className="fas fa-trash-alt"></i>
                      {isDeletingAll ? "Deleting..." : "Delete All"}
                    </button>

                    <ConfirmModal
                      show={showDeleteModal}
                      onClose={() => setShowDeleteModal(false)}
                      title="Confirm Delete All Data"
                      message="Are you sure you want to delete all data?"
                      confirmText="Yes, I'm sure"
                      loading={isDeletingAll}
                      onConfirm={handleDeleteAll}
                    />

                    <ConfirmModal
                      show={showClearForecastModal}
                      onClose={() => setShowClearForecastModal(false)}
                      title="Confirm Clear Forecast"
                      message="Are you sure you want to clear forecast data?"
                      confirmText="Yes, delete it"
                      loading={isClearingForecast}
                      onConfirm={async () => {
                        setIsClearingForecast(true);
                        try {
                          await fetch(`${API_BASE}/model/clear-forecast`, {
                            method: "DELETE",
                          });

                          setBasicProcessed(false);
                          setAdvancedProcessed(false);

                          setShowClearForecastModal(false);
                          setToastMessage(
                            "Forecast data successfully cleared!"
                          );
                          setShowSuccessToast(true);
                          setTimeout(() => setShowSuccessToast(false), 3000);

                          // Log aktivitas
                          sendActivityLog(
                            "Clear Forecast",
                            "Forecast data dihapus oleh user pada "
                          );
                        } catch {
                          setErrorMessage("Failed to clear forecast!");
                          setShowErrorToast(true);
                          setTimeout(() => setShowErrorToast(false), 3000);
                        } finally {
                          setIsClearingForecast(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                className="table-responsive shadow-sm rounded-3 border mt-3"
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
                                  ? formatFullDate(val)
                                  : val ?? "-"}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-footer-controls">
                <div className="rows-select-wrapper">
                  <select
                    className="form-select rows-select"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}>
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>

                <ul className="pagination pagination-centered">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p - 1)}>
                      Previous
                    </button>
                  </li>

                  {getPageNumbers().map((num, idx) =>
                    num === "..." ? (
                      <li key={idx} className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    ) : (
                      <li
                        key={idx}
                        className={`page-item ${
                          currentPage === num ? "active" : ""
                        }`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(num)}>
                          {num}
                        </button>
                      </li>
                    )
                  )}

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
          </div>
        ) : (
          <>
            <DragDropUpload
              apiBase={API_BASE}
              onStart={() => {
                setIsUploadingFile(true);
                setUploadProgress(0);
              }}
              onProgress={(p) => setUploadProgress(p)}
              onDone={async (res) => {
                setIsUploadingFile(false);
                await fetchUploadedData();
                const outlierData = await fetchOutliers(API_BASE);
                setOutliers(outlierData);

                setToastMessage("File uploaded & data loaded successfully!");
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);

                sendActivityLog("Upload Data", "First file upload by user at ");
              }}
              onError={(err) => {
                setIsUploadingFile(false);
                setErrorMessage(err?.message || "Upload failed");
                setShowErrorToast(true);
                setTimeout(() => setShowErrorToast(false), 4000);
              }}
            />

            <div className="alert alert-warning text-center mt-4" role="alert">
              ⚠ No data exist.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModelPage;
