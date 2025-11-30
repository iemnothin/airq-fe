import DragDropUpload from "./DragDropUpload";

const InitialUpload = ({ handleFileUpload, pushSuccess, pushError }) => {
  return (
    <>
      <DragDropUpload
        // apiBase="https://api-airq.abiila.com/api/v1"
        apiBase="http://127.0.0.1:8000/api/v1"
        onStart={() => {}}
        onProgress={() => {}}
        onDone={(res) => {
          handleFileUpload(res);
          pushSuccess("File uploaded & data loaded successfully!");
        }}
        onError={(err) => pushError(err?.message || "Upload failed")}
      />

      <div className="alert alert-warning text-center mt-4" role="alert">
        ⚠ No data exist.
      </div>
    </>
  );
};

export default InitialUpload;
