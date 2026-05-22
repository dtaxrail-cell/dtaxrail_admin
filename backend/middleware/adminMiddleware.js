import { getPool } from "../config/db.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const result = await getPool().query(
      `
      SELECT *
      FROM admin_users
      WHERE firebase_uid = $1
      AND is_active = true
      `,
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an admin.",
      });
    }

    req.admin = result.rows[0];

    next();

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default adminMiddleware;