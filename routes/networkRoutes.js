const express = require("express");
const router = express.Router();
const os = require("os");

router.get("/info", (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  let clientIP = req.socket.remoteAddress;
  let routerIP = null;

  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        routerIP = config.address;
        break;
      }
    }
    if (routerIP) break;
  }

  res.json({ clientIP, routerIP });
});

module.exports = router;
