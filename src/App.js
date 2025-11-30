import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./css/ContainerPage.css";
import "./css/ContainerSwipe.css";
import "./css/Backgrounds.css";
import "./css/Borders.css";
import "./css/Buttons.css";
import "./css/DashboardPage.css";
import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ModelPage from "./pages/ModelPage";
import ContainerPage from "./pages/ContainerPage";
import { useState } from "react";
import IspuPage from "./pages/IspuPage";
import BasicForecastPage from "./pages/BasicForecastPage";
import AdvancedForecastPage from "./pages/AdvancedForecastPage";

import LoadingScreen from "./components/LoadingScreen";
import BackendErrPage from "./pages/BackendErrPage";

function App() {
  const [loading] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <LoadingScreen />;

  if (error) {
    const randomChance = Math.random() < 0.05;
    return (
      <BackendErrPage
        message={error}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
        isIsekai={randomChance}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<ContainerPage />}>
          <Route
            path="/dashboard"
            element={<DashboardPage setError={setError} />}
          />

          <Route path="/model" element={<ModelPage setError={setError} />} />

          <Route
            path="/forecast/results"
            element={<IspuPage setError={setError} />}
          />

          <Route
            path="/forecast/basic/:pol"
            element={<BasicForecastPage setError={setError} />}
          />

          <Route
            path="/forecast/advanced/:pol"
            element={<AdvancedForecastPage setError={setError} />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
