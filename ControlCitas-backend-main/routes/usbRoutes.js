const express = require("express");
const {
  generateUSBKey,
  loginWithUSBFile,
  checkUSBKey,
  disableUSBKey,
} = require("../controllers/usbController");

const router = express.Router();

// Rutas para autenticación USB simple
router.post("/generate-key", generateUSBKey);
router.post("/login", loginWithUSBFile);
router.post("/check-key", checkUSBKey);
router.post("/disable-key", disableUSBKey);

module.exports = router;
