// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ✅ Role-based route guard
 * Keeps user logged in and checks allowed roles.
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  let user = null;
  try {
    // ✅ Fixed: correct key name
    const storedUser = localStorage.getItem("current_user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error reading session in ProtectedRoute:", error);
    localStorage.clear();
    user = null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role ? user.role.toUpperCase() : "";
  const allowed = allowedRoles.map((r) => r.toUpperCase());

  if (allowed.length > 0 && !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
