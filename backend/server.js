import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getPool } from "./config/db.js";
import authMiddleware from "./middleware/authMiddleware.js";
import adminMiddleware from "./middleware/adminMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import filingRoutes from "./routes/filingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import callbackRoutes from "./routes/callbackRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import taxToolsRoutes from "./routes/taxToolsRoutes.js";
import deadlineRoutes from "./routes/deadlineRoutes.js";

const app = express();

// ──────────────────────────────────────────────────────────────────────────
// ✅ CORS — explicit config + manual safety-net headers.
// Bare cors() can have its preflight (OPTIONS) response stripped by Vercel's
// serverless layer in some routing configs. We set headers explicitly on
// every response AND short-circuit OPTIONS requests immediately so the
// preflight always succeeds regardless of how Vercel proxies the request.
// ──────────────────────────────────────────────────────────────────────────

const corsOptions = {
  origin: true,           // reflect request origin (or replace with explicit allow-list, see note below)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Manual safety net — guarantees headers exist even if upstream proxy drops them
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Respond immediately to preflight — don't let it fall through to routes
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/filings", filingRoutes);
app.use("/payments", paymentRoutes);
app.use("/documents", documentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/members", memberRoutes);
app.use("/callbacks", callbackRoutes);
app.use("/faqs", faqRoutes);
app.use("/tax-tools", taxToolsRoutes);
app.use("/deadlines", deadlineRoutes);

app.get("/", async (req, res) => {
  try {
    const result = await getPool().query("SELECT NOW()");
    res.json({
      success: true,
      message: "D Tax Rail Backend Running",
      databaseTime: result.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get(
  "/protected",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    res.json({
      success: true,
      message: "Protected route accessed",
      user: req.user,
    });
  }
);

app.post(
  "/auth/sync-user",
  authMiddleware,
  async (req, res) => {
    try {
      const { uid, email } = req.user;
      const existingUser = await getPool().query(
        "SELECT * FROM admin_users WHERE firebase_uid = $1",
        [uid]
      );

      if (existingUser.rows.length === 0) {
        await getPool().query(
          `INSERT INTO admin_users (firebase_uid, email, name) VALUES ($1, $2, $3)`,
          [uid, email, email.split("@")[0]]
        );
      }
      res.json({ success: true, message: "User synced successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;