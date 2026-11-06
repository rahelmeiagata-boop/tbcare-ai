
import bcrypt from "bcrypt";
import db from "./config/db.js";

const email = "pendamping@gmail.com";
const newPassword = "12345678";

try {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const [result] = await db.execute(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashedPassword, email]
  );

  if (result.affectedRows === 0) {
    console.log("Akun pendamping tidak ditemukan.");
  } else {
    console.log("Password akun pendamping berhasil direset.");
  }
} catch (error) {
  console.error("Gagal mereset password:", error.message);
} finally {
  await db.end();
}
