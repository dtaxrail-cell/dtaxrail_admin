import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import adminMiddleware
from "../middleware/adminMiddleware.js";

import {

  getFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,

} from "../controllers/faqController.js";

const router =
express.Router();



// CUSTOMER FAQS
router.get(
  "/",
  getFaqs
);



// ADMIN FAQS
router.get(
  "/admin",

  authMiddleware,
  adminMiddleware,

  getAdminFaqs
);



// CREATE FAQ
router.post(
  "/",

  authMiddleware,
  adminMiddleware,

  createFaq
);



// UPDATE FAQ
router.put(
  "/:faqId",

  authMiddleware,
  adminMiddleware,

  updateFaq
);

export default router;