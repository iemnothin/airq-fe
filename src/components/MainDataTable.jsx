import React from "react";
import DragDropUpload from "./DragDropUpload";
import ProcessingPanel from "./ProcessingPanel";
import ConfirmModal from "./ConfirmModal";

const MainDataTable = ({
  uploadedData,
  filteredData,
  outliers,
  currentRows,
  totalPages,
  pageNumbers,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  formatFullDate,
  searchDate,
  setSearchDate,
  showSingleUpload,
  setShowSingleUpload,
  handleFileUpload,
  basicProcessed,
  navigate,
  processBasicForecast,
  handleOutlierProcessing,
  pushSuccess,
  pushError,
}) => {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      {/* Upload section */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: showSingleUpload ? "500px" : "0px",
          transition: "max-height 0.4s ease",
        }}>
        {showSingleUpload && (
          <div className="mb-4">
            <DragDropUpload
              // apiBase="https://api-airq.abiila.com/api/v1"
              apiBase="http://127.0.0.1:8000/api/v1"
              onStart={() => {}}
              onProgress={() => {}}
              onDone={handleFileUpload}
              onError={(err) => pushError(err?.message || "Upload failed")}
            />
          </div>
        )}
      </div>

      {/* Table header */}
      <div className="text-center mb-3">
        <h5 className="fw-bold fs-4">Data Kualitas Udara Kota Bogor</h5>
        <small className="text-muted">
          Showing {filteredData.length} of {uploadedData.length} records
        </small>
      </div>

      {/* Toolbar */}
      <div className="action-toolbar bg-white rounded p-2 mb-3 shadow-sm flex-wrap">
        {/* Search date */}
        <div className="search-toolbar d-flex gap-2">
          <label className="fw-bold text-secondary">Search by Date:</label>
          <input
            type="date"
            className="form-control form-control-sm"
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

        {/* Right buttons */}
        <div className="d-flex flex-wrap justify-content-end gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowSingleUpload(!showSingleUpload)}>
            <i
              className={`fas ${
                showSingleUpload ? "fa-times" : "fa-upload"
              }`}></i>
            {showSingleUpload ? "Close" : "New Data"}
          </button>

          {basicProcessed && (
            <button
              onClick={() => navigate("/forecast/basic")}
              className="btn btn-info btn-sm d-flex align-items-center gap-1">
              <i className="fas fa-chart-line"></i> View Basic Result
            </button>
          )}

          <ProcessingPanel
            // API_BASE="https://api-airq.abiila.com/api/v1"
            API_BASE="http://127.0.0.1:8000/api/v1"
            onStart={() => {}}
            onDone={processBasicForecast}
          />

          <button
            className="btn btn-warning btn-sm"
            onClick={handleOutlierProcessing}>
            <i className="fas fa-wrench"></i> Handle Outlier
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow-sm rounded-3 border mt-3">
        <table className="table table-bordered table-striped">
          <thead className="table-success">
            <tr>
              <th>No</th>
              {Object.keys(uploadedData[0])
                .filter((k) => k !== "id")
                .map((key) => (
                  <th key={key}>{key.toUpperCase()}</th>
                ))}
            </tr>
          </thead>

          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>

                {Object.entries(row)
                  .filter(([k]) => k !== "id")
                  .map(([key, val]) => (
                    <td key={key}>
                      {key === "waktu" ? formatFullDate(val) : val ?? "-"}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="table-footer-controls">
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

        <ul className="pagination pagination-centered">
          {pageNumbers.map((num, i) =>
            num === "..." ? (
              <li className="page-item disabled" key={i}>
                <span className="page-link">…</span>
              </li>
            ) : (
              <li
                className={`page-item ${currentPage === num ? "active" : ""}`}
                key={i}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(num)}>
                  {num}
                </button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default MainDataTable;
