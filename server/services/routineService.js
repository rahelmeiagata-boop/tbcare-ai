import db from "../config/db.js";

export const saveRoutine = async (userId, data) => {
  const {
    wake_time,
    breakfast_time,
    lunch_time,
    dinner_time,
    sleep_time,
  } = data;

  console.log("1. MASUK SERVICE");

  const sql = `
    INSERT INTO user_routines
    (
      user_id,
      wake_time,
      breakfast_time,
      lunch_time,
      dinner_time,
      sleep_time
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      wake_time = VALUES(wake_time),
      breakfast_time = VALUES(breakfast_time),
      lunch_time = VALUES(lunch_time),
      dinner_time = VALUES(dinner_time),
      sleep_time = VALUES(sleep_time)
  `;

  const values = [
    userId,
    wake_time,
    breakfast_time,
    lunch_time,
    dinner_time,
    sleep_time,
  ];

  console.log("2. SQL =", sql);
  console.log("3. VALUES =", values);

  const [result] = await db.execute(sql, values);

  console.log("4. QUERY BERHASIL");
  console.log(result);

  return getRoutine(userId);
};

export const getRoutine = async (userId) => {
  console.log("5. MASUK GET ROUTINE");

  const [rows] = await db.execute(
    `
    SELECT *
    FROM user_routines
    WHERE user_id = ?
    `,
    [userId]
  );

  console.log("6. HASIL SELECT =", rows);

  return rows[0];
};