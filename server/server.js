import dotenv from "dotenv";
import app from "./app.js";
import db from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await db.getConnection();

    console.log("✅ Connected to MySQL");

    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Gagal koneksi ke MySQL");
    console.error(err.message);
  }
};

startServer();