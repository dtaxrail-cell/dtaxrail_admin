import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getPool } from "./config/db.js";
import authMiddleware from "./middleware/authMiddleware.js";

import adminMiddleware from "./middleware/adminMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

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
  console.log("Protected route hit");
  console.log(req.user);

  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});



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
        `
        INSERT INTO admin_users (
          firebase_uid,
          email,
          name
        )
        VALUES ($1, $2, $3)
        `,
        [uid, email, email.split("@")[0]]
      );

      console.log("New admin user inserted");
    } else {
      console.log("Admin user already exists");
    }

    res.json({
      success: true,
      message: "User synced successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});