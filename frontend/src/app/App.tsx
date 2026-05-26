import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Login } from "./pages/Login";

import { Filings } from "./pages/Filings";
import { FilingDetails } from "./pages/FilingDetails";

import { Customers } from "./pages/Customers";
import { Payments } from "./pages/Payments";

import { Documents } from "./pages/Documents";
import { DocumentDetails } from "./pages/DocumentDetails";

import { Callbacks } from "./pages/Callbacks";
import { Support } from "./pages/Support";
import { Notifications } from "./pages/Notifications";
import { TaxTools } from "./pages/TaxTools";

import { MainLayout } from "./components/layout/MainLayout";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Toaster } from "./components/ui/sonner";





export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>





          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />





          {/* REDIRECT ROOT */}
          <Route
  path="/"
  element={<Navigate to="/filings" replace />}
/>





          {/* FILINGS */}
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





          {/* FILING DETAILS */}
          <Route
            path="/filings/:filingId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FilingDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />





          {/* CUSTOMERS */}
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





          {/* PAYMENTS */}
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





          {/* DOCUMENTS */}
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





          {/* DOCUMENT DETAILS */}
          <Route
            path="/document-details/:filingId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DocumentDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />





          {/* CALLBACKS */}
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





          {/* SUPPORT */}
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





          {/* NOTIFICATIONS */}
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





          {/* TAX TOOLS */}
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

        </Routes>





        <Toaster />

      </BrowserRouter>

    </AuthProvider>
  );
}