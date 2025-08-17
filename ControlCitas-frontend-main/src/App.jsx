import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import RegisterUser from "./pages/Register/RegisterUser";
import Login from "./pages/Login/Login";
import HomePaciente from "./pages/Home/Home_paciente";
import AgendarCita from "./pages/Paciente/AgendarCita";
import MisCitas from "./pages/Paciente/MisCitas";
import ProtectedRoute from "./Protected Route/ProtectedRoute";
import NavbarApp from "./components/Navbar";
import Footer from "./components/Footer";
import CambiarContrasena from "./components/CambiarContrasena";
import HomeAdmin from "./pages/Home/HomeAdmin";
import DashboardAdmin from "./pages/Admin/DashboardAdmin";
import UsuariosAdmin from "./pages/Admin/UsuariosAdmin";
import MedicosAdmin from "./pages/Admin/MedicosAdmin";
import EspecialidadesAdmin from "./pages/Admin/EspecialidadesAdmin";
import RegistrarMedico from "./pages/Admin/RegistrarMedico";
import HomeMedico from "./pages/Home/Home_medico";
import HorarioMedico from "./pages/Medico/HorarioMedico";
import CitasMedico from "./pages/Medico/CitasMedico";
import ExpedientePaciente from "./pages/Paciente/ExpedientePaciente";
import ExpedienteMedico from "./pages/Medico/ExpedienteMedico";
import ContactosPaciente from "./pages/Paciente/ContactosPaciente";
import ContactosPacienteAdmin from "./pages/Admin/ContactosPacienteAdmin";
import AutoLogout from "./components/AutoLogout";
import ForgotPassword from "./pages/Login/ForgotPassword";

import MFASetup from "./components/MFASetup";

function AppContent() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const hideNavbar =
    location.pathname === "/" || location.pathname === "/registerUser" || !user;

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideNavbar && <NavbarApp />}
      <div className="flex-grow-1">
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route path="/registerUser" element={<RegisterUser />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />{" "}
          {/* ---------------------------------------------------------------------- */}
          <Route
            path="/mfa-setup"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "medico", "paciente"]}>
                <MFASetup />
              </ProtectedRoute>
            }
          />
          {/* //----------------------------------------------------------------------------- */}
          {/* Solo para pacientes */}
          <Route
            path="/home_paciente"
            element={
              <ProtectedRoute rolesPermitidos={["paciente"]}>
                <HomePaciente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agendar-cita"
            element={
              <ProtectedRoute rolesPermitidos={["paciente"]}>
                <AgendarCita />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-citas"
            element={
              <ProtectedRoute rolesPermitidos={["paciente"]}>
                <MisCitas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expediente"
            element={
              <ProtectedRoute rolesPermitidos={["paciente"]}>
                <ExpedientePaciente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-contactos"
            element={
              <ProtectedRoute rolesPermitidos={["paciente"]}>
                <ContactosPaciente />
              </ProtectedRoute>
            }
          />
          <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
          {/* Rutas para admin */}
          <Route
            path="/home_admin"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <HomeAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <UsuariosAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medicos"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <MedicosAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registrar-medico"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <RegistrarMedico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/especialidades"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <EspecialidadesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contactos-paciente"
            element={
              <ProtectedRoute rolesPermitidos={["admin"]}>
                <ContactosPacienteAdmin />
              </ProtectedRoute>
            }
          />
          {/* Rutas para médico */}
          <Route
            path="/home_medico"
            element={
              <ProtectedRoute rolesPermitidos={["medico"]}>
                <HomeMedico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/horario"
            element={
              <ProtectedRoute rolesPermitidos={["medico"]}>
                <HorarioMedico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/citas"
            element={
              <ProtectedRoute rolesPermitidos={["medico"]}>
                <CitasMedico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/expediente"
            element={
              <ProtectedRoute rolesPermitidos={["medico"]}>
                <ExpedienteMedico />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AutoLogout />
      <AppContent />
    </Router>
  );
}

export default App;
