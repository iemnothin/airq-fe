const InfoCards = ({ info, onOutlierClick }) => {
  return (
    <div className="row mb-4">
      {/* Total Data */}
      <div className="col-12 col-md-4 mb-3">
        <div className="card bg-primary h-100 text-white">
          <div className="card-body d-flex align-items-center gap-3">
            <i className="fas fa-database fs-2"></i>
            <div>
              <h5 className="fw-bold">Total Data</h5>
              <p className="fs-5">{info.totalData}</p>
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
          onClick={onOutlierClick}>
          <div className="card-body d-flex align-items-center gap-3">
            <i
              className={`fas ${
                info.outlierCount === 0
                  ? "fa-check-circle"
                  : "fa-exclamation-triangle"
              } fs-2`}></i>
            <div>
              <h5 className="fw-bold">Outlier</h5>
              <p className="fs-5">
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
              <h5 className="fw-bold">NaN / Null</h5>
              <p className="fs-5">
                {info.nanCount === 0 ? "Clear" : `${info.nanCount} data`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCards;
