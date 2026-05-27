import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Tenant/Home";
import TenantRegister from "./pages/Tenant/Register";
import TenantLogin from "./pages/Tenant/Login";
import LandlordRegister from "./pages/Landlord/Register";
import LandlordLogin from "./pages/Landlord/Login";
import AdminRegister from "./pages/Admin/Register";
import AdminLogin from "./pages/Admin/Login";
import Verify from "./pages/accountVerification/Verify";
import Payments from "./pages/Payments/Payments";
import Maintenance from "./pages/Maintenance/Maintenance";
import Profile from "./pages/Profile/Profile";
import Messages from "./pages/Messages/Messages";
import About from "./pages/About/About";
import Notifications from "./pages/Notifications/Notifications";
import LandlordHome from "./pages/Landlord/Home";
import SuccessPage from "./pages/Success/Success";
import CancelPage from "./pages/Cancel/Cancel";
import Listings from "./pages/Landlord/Listings";
import LandlordPayments from "./pages/Landlord/Payments";
import Reports from "./pages/Landlord/Reports";
import Dashboard from "./pages/Landlord/Dashboard";
import Tenants from "./pages/Landlord/Tenants";
import LandingPage from "./pages/Landing/Landing";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminListings from "./pages/Admin/AdminListings";
import PasswordReset from "./pages/PasswordReset/PasswordReset";
import PasswordChange from "./pages/PasswordReset/PasswordChange";
import Users from "./pages/Admin/Users";
import AdminPayments from "./pages/Admin/AdminPayments";
import Technicians from "./pages/Admin/Technicians";

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 1800 }} />
      <Routes>
        
        <Route path="/" element={<LandingPage/>} />
        <Route path="/home" element={<Home />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signup/tenant" element={<TenantRegister />} />
        <Route path="/login/tenant" element={<TenantLogin />} />
        <Route path="/signup/landlord" element={<LandlordRegister />} />
        <Route path="/login/landlord" element={<LandlordLogin />} />
        <Route path="/signup/admin" element={<AdminRegister />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/account-verification" element={<Verify />} />
        <Route path="/maintenance-requests" element={<Maintenance />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/about" element={<About />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/home/landlord" element={<LandlordHome />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/payment/success" element={<SuccessPage />} />
        <Route path="/payment/cancelled" element={<CancelPage />} />
        <Route path="/landlord/payments" element={<LandlordPayments />} />
        <Route path="/landlord/reports" element={<Reports />} />
        <Route path="/landlord/dashboard" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/forgot-password" element={<PasswordReset />} />
        <Route path="/password/reset" element={<PasswordChange />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/technicians" element={<Technicians />} />
      </Routes>
    </Router>
  );
}

export default App;
