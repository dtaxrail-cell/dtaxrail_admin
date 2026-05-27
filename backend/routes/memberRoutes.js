import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import {

  createMember,
  getMembers,

} from "../controllers/memberController.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createMember
);

router.get(
  "/",
  authMiddleware,
  getMembers
);

export default router;