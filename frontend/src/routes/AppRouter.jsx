import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// ─── Public Pages ───
import Home from "../pages/Home/Home";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import FindBlood from "../pages/FindBlood/Findblood";
import Eligibility from "../pages/FindBlood/Eligibility";
import Camps from "../pages/Camps/Camps";

// ─── Admin Pages ───
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageHospitals from "../pages/admin/components/ManageHospitals";
import ManageDonors from "../pages/admin/components/ManageDonors";
import ManageReceivers from "../pages/admin/components/ManageReceivers";
import ManageCamps from "../pages/admin/components/ManageCamps";

// ─── Hospital Pages ───
import DashboardHospital from "../pages/hospital/DashboardHospital";
import HospitalStock from "../pages/hospital/HospitalStock";
import HospitalCamps from "../pages/hospital/HospitalCamps";
import HospitalProfile from "../pages/hospital/HospitalProfile";
import CampRequests from "../pages/hospital/CampRequests";

// ─── Donor Pages ───
import DashboardDonor from "../pages/donor/DashboardDonor";
import DonorProfile from "../pages/donor/DonorProfile";
import MyCamps from "../pages/donor/MyCamps";

// ─── Receiver Pages ───
import DashboardReceiver from "../pages/receiver/DashboardReceiver";
import ReceiverProfile from "../pages/receiver/ReceiverProfile";

const AppRouter = ({ onLogin }) => {
  return (
    <Routes>
      {/* ─────────────── PUBLIC ROUTES ─────────────── */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/find-blood" element={<FindBlood />} />
      <Route path="/eligibility" element={<Eligibility />} />
      <Route path="/camps" element={<Camps />} />

      {/* ─────────────── ADMIN ROUTES ─────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-hospitals"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageHospitals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-donors"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageDonors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-receivers"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageReceivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-camps"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ManageCamps />
          </ProtectedRoute>
        }
      />

      {/* ─────────────── HOSPITAL ROUTES ─────────────── */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute allowedRoles={["HOSPITAL"]}>
            <DashboardHospital />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/stock"
        element={
          <ProtectedRoute allowedRoles={["HOSPITAL"]}>
            <HospitalStock />
          </ProtectedRoute>
        }
      />
      {/* ✅ This is the route for creating and listing camps */}
      <Route
        path="/hospital/create-camp"
        element={
          <ProtectedRoute allowedRoles={["HOSPITAL"]}>
            <HospitalCamps />
          </ProtectedRoute>
        }
      />
      {/* ✅ View donor requests for hospital’s camps */}
      <Route
        path="/hospital/camp-requests"
        element={
          <ProtectedRoute allowedRoles={["HOSPITAL"]}>
            <CampRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/profile"
        element={
          <ProtectedRoute allowedRoles={["HOSPITAL"]}>
            <HospitalProfile />
          </ProtectedRoute>
        }
      />

      {/* ─────────────── DONOR ROUTES ─────────────── */}
      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["DONOR"]}>
            <DashboardDonor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/profile"
        element={
          <ProtectedRoute allowedRoles={["DONOR"]}>
            <DonorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/my-camps"
        element={
          <ProtectedRoute allowedRoles={["DONOR"]}>
            <MyCamps />
          </ProtectedRoute>
        }
      />

      {/* ─────────────── RECEIVER ROUTES ─────────────── */}
      <Route
        path="/receiver/dashboard"
        element={
          <ProtectedRoute allowedRoles={["RECEIVER"]}>
            <DashboardReceiver />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receiver/profile"
        element={
          <ProtectedRoute allowedRoles={["RECEIVER"]}>
            <ReceiverProfile />
          </ProtectedRoute>
        }
      />

      {/* ─────────────── FALLBACK ROUTE ─────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
