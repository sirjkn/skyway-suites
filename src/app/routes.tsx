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
import { MyBookings } from "./pages/MyBookings";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProperties } from "./pages/admin/AdminProperties";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminSettings } from "./pages/admin/AdminSettings";
import EmailDiagnostics from "./pages/admin/EmailDiagnostics";
import DebugSettings from "./pages/admin/DebugSettings";
import EmailTemplates from "./pages/admin/EmailTemplates";
import { DatabaseMigration } from "./pages/admin/DatabaseMigration";
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";
import { RealtimeIndicator } from "./components/RealtimeIndicator";
import { DatabaseStatus } from "./components/DatabaseStatus";
import { RouteError } from "./components/RouteError";

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
    errorElement: <RouteError />,
    children: [
      {
        path: "/",
        Component: Layout,
        errorElement: <RouteError />,
        children: [
          { index: true, Component: Home, errorElement: <RouteError /> },
          { path: "about", Component: About, errorElement: <RouteError /> },
          { path: "properties", Component: AllProperties, errorElement: <RouteError /> },
          { path: "properties/:id", Component: PropertyDetails, errorElement: <RouteError /> },
          { path: "contact", Component: Contact, errorElement: <RouteError /> },
          { path: "create-account", Component: CreateAccount, errorElement: <RouteError /> },
          { path: "login", Component: Login, errorElement: <RouteError /> },
          { path: "profile", Component: CustomerProfile, errorElement: <RouteError /> },
          { path: "my-bookings", Component: MyBookings, errorElement: <RouteError /> },
        ],
      },
      {
        path: "/admin",
        Component: AdminLayout,
        errorElement: <RouteError />,
        children: [
          { index: true, Component: AdminProperties, errorElement: <RouteError /> },
          { path: "properties", Component: AdminProperties, errorElement: <RouteError /> },
          { path: "bookings", Component: AdminBookings, errorElement: <RouteError /> },
          { path: "customers", Component: AdminCustomers, errorElement: <RouteError /> },
          { path: "payments", Component: AdminPayments, errorElement: <RouteError /> },
          { path: "settings", Component: AdminSettings, errorElement: <RouteError /> },
          { path: "email-diagnostics", Component: EmailDiagnostics, errorElement: <RouteError /> },
          { path: "debug-settings", Component: DebugSettings, errorElement: <RouteError /> },
          { path: "email-templates", Component: EmailTemplates, errorElement: <RouteError /> },
          { path: "database-migration", Component: DatabaseMigration, errorElement: <RouteError /> },
        ],
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);