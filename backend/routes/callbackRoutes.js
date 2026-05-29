import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import adminMiddleware
from "../middleware/adminMiddleware.js";

import {

  createCallback,
  getCallbacks,
  updateCallbackStatus,

} from "../controllers/callbackController.js";

const router =
express.Router();



// CUSTOMER CREATE CALLBACK
router.post(
  "/create",

  authMiddleware,

  createCallback
);



// ADMIN GET CALLBACKS
router.get(
  "/",

  authMiddleware,
  adminMiddleware,

  getCallbacks
);



// ADMIN UPDATE STATUS
router.put(
  "/:callbackId/status",

  authMiddleware,
  adminMiddleware,

  updateCallbackStatus
);

export default router;