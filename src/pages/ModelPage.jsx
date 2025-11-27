import "bootstrap/dist/css/bootstrap.min.css";
import "../css/ModelPage.css";

import OutlierModal from "../components/OutlierModal";
import NoFileModal from "../components/NoFileModal";
import SuccessToast from "../components/SuccessToast";
import ErrorToast from "../components/ErrorToast";
import InfoCards from "../components/InfoCards";
import MainDataTable from "../components/MainDataTable";
import InitialUpload from "../components/InitialUpload";

import { useNavigate } from "react-router-dom";

import useModelData from "../hooks/useModelData";
import useOutlierActions from "./hooks/useOutlierActions";
import useFileUpload from "../hooks/useFileUpload";
import useForecastActions from "../hooks/useForecastActions";
import useToast from "../hooks/useToast";
import paginate from "../hooks/PaginationHelper";
import formatFullDate from "../hooks/DateFormatter";

const API_BASE = "https://api-airq.abiila.com/api/v1";

const ModelPage = ({ setError }) => {
  const navigate = useNavigate();

  // ============ Custom Hooks ============
  const {
    uploadedData,
    filteredData,
    info,
    searchDate,
    setSearchDate,
    refreshData,
  } = useModelData(API_BASE);

  const {
    outliers,
    setOutliers,
    showOutlierModal,
    openOutlierModal,
    handleOutlierProcessing,
  } = useOutlierActions(API_BASE, refreshData, setError);

  const {
    isUploadingFile,
    uploadProgress,
    showSingleUpload,
    setShowSingleUpload,
    handleFileUpload,
  } = useFileUpload(API_BASE, refreshData, setOutliers);

  const { processBasicForecast, basicProcessed, isProcessing } =
    useForecastActions(API_BASE, refreshData);

  const {
    showSuccessToast,
    showErrorToast,
    toastMessage,
    errorMessage,
    pushSuccess,
    pushError,
  } = useToast();

  // Pagination
  const {
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
    currentRows,
    totalPages,
    pageNumbers,
  } = paginate(filteredData);

  return (
    <>
      <SuccessToast show={showSuccessToast} text={toastMessage} />
      <ErrorToast show={showErrorToast} text={errorMessage} />

      {/* OVERLAY */}
      {(isProcessing || isUploadingFile) && (
        <div className="global-overlay">
          <div className="spinner-border text-light big-spinner"></div>
          <p className="overlay-text">
            {isProcessing ? "Processing model..." : "Uploading file..."}
          </p>
          {isUploadingFile && uploadProgress > 0 && (
            <div className="progress upload-progress">
              <div
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================== MODALS ================== */}
      <OutlierModal
        show={showOutlierModal}
        onClose={() => openOutlierModal(false)}
        outliers={outliers}
      />
      <NoFileModal show={false} />

      <div className="model-content-wrapper px-0 py-4">
        {/* =================== INFO CARDS =================== */}
        {uploadedData.length > 0 && (
          <InfoCards info={info} onOutlierClick={openOutlierModal} />
        )}

        {/* =================== MAIN TABLE CONTENT =================== */}
        {uploadedData.length > 0 ? (
          <MainDataTable
            {...{
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
            }}
          />
        ) : (
          <InitialUpload
            handleFileUpload={handleFileUpload}
            pushSuccess={pushSuccess}
            pushError={pushError}
          />
        )}
      </div>
    </>
  );
};

export default ModelPage;
