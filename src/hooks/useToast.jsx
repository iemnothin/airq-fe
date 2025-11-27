// src/hooks/useToast.js
import { useState } from "react";

const useToast = () => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const pushSuccess = (msg) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const pushError = (msg) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 3500);
  };

  return {
    showSuccessToast,
    showErrorToast,
    toastMessage,
    errorMessage,
    pushSuccess,
    pushError,
  };
};

export default useToast;
