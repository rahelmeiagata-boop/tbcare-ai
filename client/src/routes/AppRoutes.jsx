import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import MedicinePage from "../pages/medicine/MedicinePage";
import RoutinePage from "../pages/routine/RoutinePage";
import RecommendationPage from "../pages/recommendation/RecommendationPage";
import FamilyPage from "../pages/family/FamilyPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/medications"
          element={<MedicinePage />}
        />

        <Route
          path="/routine"
          element={<RoutinePage />}
        />

        <Route
          path="/recommendation"
          element={<RecommendationPage />}
        />

        <Route
          path="/family"
          element={<FamilyPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;