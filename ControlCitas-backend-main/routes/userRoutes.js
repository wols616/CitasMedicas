const express = require("express"); //Crear el server para dar rutas
const router = express.Router(); // Crear un enrutador y para definir las rutas

const {
  registerUser,
  loginUser,
  loginPorRostro,
  cambiarContrasena,
  recuperarContrasena,
  mfaSetup,
  mfaVerifySetup,
  mfaVerifyLogin,
  checkMFAStatus,
  getMFARecoveryCodes,
  regenerateMFARecoveryCodes,
  updateSecurityQuestions,
  verifySecurityQuestion,
  getRandomSecurityQuestion
} = require("../controllers/userController");

// Rutas para autenticación básica
router.post("/registrarUsuario", registerUser); //Registrar usuario
router.post("/iniciarSesion", loginUser); //Iniciar sesión
router.post("/loginPorRostro", loginPorRostro); //Login por reconocimiento facial
router.post("/cambiar-contrasena", cambiarContrasena); //Cambiar contraseña
router.post("/recuperarContrasena", recuperarContrasena); //Recuperar contraseña

// Rutas para MFA
router.post("/mfa-setup", mfaSetup);
router.post("/mfa-verify-setup", mfaVerifySetup);
router.post("/mfa-verify-login", mfaVerifyLogin);
router.post("/check-mfa-status", checkMFAStatus);
router.post("/get-mfa-recovery-codes", getMFARecoveryCodes);
router.post("/regenerate-mfa-recovery-codes", regenerateMFARecoveryCodes);

// Rutas para preguntas de seguridad
router.post("/update-security-questions", updateSecurityQuestions);
router.post("/verify-security-question", verifySecurityQuestion);
router.get("/security-question/:userId", getRandomSecurityQuestion);
// Exportar el router
module.exports = router;
