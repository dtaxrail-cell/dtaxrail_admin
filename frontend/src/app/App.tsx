import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { Login }              from "./pages/Login";
import { FilingsSpreadsheet } from "./pages/FilingsSpreadsheet";
import { FilingDetails }      from "./pages/FilingDetails";
import { Customers }          from "./pages/Customers";
import { Documents }          from "./pages/Documents";
import { DocumentDetails }    from "./pages/DocumentDetails";
import { Callbacks }          from "./pages/Callbacks";
import { Support }            from "./pages/Support";
import { TaxTools }           from "./pages/TaxTools";
import { Deadlines }          from "./pages/Deadlines"; // ✅ 1. Added missing Deadlines import

import { MainLayout }    from "./components/layout/MainLayout";
import { AuthProvider }  from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster }       from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* REDIRECT ROOT → FILINGS */}
          <Route path="/" element={<Navigate to="/filings" replace />} />

          {/* FILINGS SPREADSHEET (replaces old Filings + Payments) */}
          <Route
            path="/filings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FilingsSpreadsheet />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* FILING WORKSPACE */}
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

          {/* ✅ 2. REGISTERED NEW GOVERNMENT DEADLINES CMS ROUTE */}
          <Route
            path="/deadlines"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Deadlines />
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