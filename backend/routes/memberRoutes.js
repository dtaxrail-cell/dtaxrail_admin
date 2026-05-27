import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {

  createMember,
  getMembers,
  updateMember,
  deleteMember,

} from "../controllers/memberController.js";

const router = express.Router();



// CREATE MEMBER
router.post(
  "/create",
  authMiddleware,
  createMember
);



// GET MEMBERS
router.get(
  "/",
  authMiddleware,
  getMembers
);



// UPDATE MEMBER
router.put(
  "/update/:memberId",
  authMiddleware,
  updateMember
);



// DELETE MEMBER
router.delete(
  "/delete/:memberId",
  authMiddleware,
  deleteMember
);

export default router;