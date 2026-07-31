import { Routes, Route, NavLink } from "react-router-dom";
import IntakeForm from "./pages/IntakeForm.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import CaseDetail from "./pages/CaseDetail.jsx";
import CaseSummary from "./pages/CaseSummary.jsx";
import ReferenceLibrary from "./pages/ReferenceLibrary.jsx";

// Login is temporarily disabled — Login.jsx is still in this folder, unused for now.
// To re-enable: bring back RequireAuth + the /login route, and the nav-user/logout
// block below (see git history / previous version of this file).

function DoctorApp() {
  return (
    <div className="app-shell">
      <div className="top-nav">
        <h1>Cervical Cancer Screening Assistant</h1>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Patient intake
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Doctor dashboard
          </NavLink>
          <NavLink to="/reference-library" className={({ isActive }) => (isActive ? "active" : "")}>
            Reference library
          </NavLink>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<IntakeForm />} />
        <Route path="/dashboard" element={<DoctorDashboard />} />
        <Route path="/patients/:patientId" element={<CaseDetail />} />
        <Route path="/patients/:patientId/summary" element={<CaseSummary />} />
        <Route path="/reference-library" element={<ReferenceLibrary />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<DoctorApp />} />
    </Routes>
  );
}
