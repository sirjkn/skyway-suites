import { createBrowserRouter, Outlet } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { AllProperties } from "./pages/AllProperties";
import { Contact } from "./pages/Contact";
import { CreateAccount } from "./pages/CreateAccount";
import { Login } from "./pages/Login";
import { PropertyDetails } from "./pages/PropertyDetails";
import { CustomerProfile } from "./pages/CustomerProfile";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProperties } from "./pages/admin/AdminProperties";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminSettings } from "./pages/admin/AdminSettings";
import EmailDiagnostics from "./pages/admin/EmailDiagnostics";
import DebugSettings from "./pages/admin/DebugSettings";
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";
import { RealtimeIndicator } from "./components/RealtimeIndicator";
import { DatabaseStatus } from "./components/DatabaseStatus";

// Root component that provides auth context to all routes
function Root() {
  return (
    <AuthProvider>
      <MaintenanceWrapper>
        <Outlet />
        <RealtimeIndicator />
        <DatabaseStatus />
      </MaintenanceWrapper>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Home },
          { path: "about", Component: About },
          { path: "properties", Component: AllProperties },
          { path: "properties/:id", Component: PropertyDetails },
          { path: "contact", Component: Contact },
          { path: "create-account", Component: CreateAccount },
          { path: "login", Component: Login },
          { path: "profile", Component: CustomerProfile },
        ],
      },
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminProperties },
          { path: "properties", Component: AdminProperties },
          { path: "bookings", Component: AdminBookings },
          { path: "customers", Component: AdminCustomers },
          { path: "payments", Component: AdminPayments },
          { path: "settings", Component: AdminSettings },
          { path: "email-diagnostics", Component: EmailDiagnostics },
          { path: "debug-settings", Component: DebugSettings },
        ],
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);