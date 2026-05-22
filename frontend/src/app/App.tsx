import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Filings } from "./pages/Filings";
import { FilingDetails } from "./pages/FilingDetails";
import { Customers } from "./pages/Customers";
import { Payments } from "./pages/Payments";
import { Documents } from "./pages/Documents";
import { Callbacks } from "./pages/Callbacks";
import { Support } from "./pages/Support";
import { Notifications } from "./pages/Notifications";
import { TaxTools } from "./pages/TaxTools";
import { Settings } from "./pages/Settings";
import { Logs } from "./pages/Logs";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/filings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Filings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/filings/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FilingDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Customers />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Payments />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Documents />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/callbacks"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Callbacks />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Support />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tax-tools"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaxTools />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Logs />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}