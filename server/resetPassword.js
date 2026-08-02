import bcrypt from "bcrypt";
import db from "./config/db.js";

const newPassword = "12345678";

const hashedPassword = await bcrypt.hash(newPassword, 10);

await db.execute(
  "UPDATE users SET password = ? WHERE email = ?",
  [hashedPassword, "rahel@gmail.com"]
);

console.log("Password berhasil direset.");
process.exit();