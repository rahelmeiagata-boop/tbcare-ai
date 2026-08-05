import db from "../config/db.js";

const calculateStreak = (days) => {

  if (days.length === 0) return 0;

  let streak = 0;

  let current = new Date();

  current.setHours(0, 0, 0, 0);

  for (const row of days) {

    const day = new Date(row.day);

    day.setHours(0, 0, 0, 0);

    const diff =
      (current - day) /
      (1000 * 60 * 60 * 24);

    if (diff === streak) {

      streak++;

    } else {

      break;

    }

  }

  return streak;

};

const calculateTherapyDay = (startDate) => {

  if (!startDate) return 0;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);

  start.setHours(0, 0, 0, 0);

  const diff = Math.floor(
    (today - start) /
    (1000 * 60 * 60 * 24)
  );

  return diff + 1;

};

console.log("DASHBOARD SERVICE BARU LOADED");

export const getDashboardData = async (userId) => {

  console.log("================================");
  console.log("USER ID :", userId);

  // Jadwal obat
  const [todaySchedule] = await db.execute(
    `
    SELECT
      ms.id,
      ms.scheduled_time,
      m.med_name,
      COALESCE(
        (
          SELECT ml.status
FROM medication_logs ml
WHERE
ml.schedule_id = ms.id
AND DATE(ml.taken_at)=CURDATE()
ORDER BY ml.id DESC
LIMIT 1
        ),
        'pending'
      ) AS status
    FROM medication_schedules ms
    JOIN medications m
      ON ms.medication_id = m.id
    WHERE m.user_id = ?
    ORDER BY
CASE
    WHEN COALESCE(
        (
            SELECT ml.status
            FROM medication_logs ml
            WHERE ml.schedule_id = ms.id
            ORDER BY ml.id DESC
            LIMIT 1
        ),
        'pending'
    ) = 'taken'
    THEN 1
    ELSE 0
END,
ms.scheduled_time ASC
    `,
    [userId]
  );

  console.log("TODAY SCHEDULE :", todaySchedule);

  // Total stok obat
  const [stockData] = await db.execute(
    `
  SELECT COALESCE(SUM(stock), 0) AS total_stock
  FROM medications
  WHERE user_id = ?
  `,
    [userId]
  );

  console.log("TOTAL STOCK :", stockData);
  console.log("TOTAL STOCK :", stockData);

  // Total obat yang sudah diminum
  const [takenLogs] = await db.execute(
    `
    SELECT COUNT(DISTINCT ml.schedule_id) AS total
    FROM medication_logs ml
    JOIN medication_schedules ms
      ON ml.schedule_id = ms.id
    JOIN medications m
      ON ms.medication_id = m.id
    WHERE
      m.user_id = ?
      AND ml.status = 'taken'
    `,
    [userId]
  );

  console.log("TAKEN LOGS :", takenLogs);

  // Semua hari pengguna berhasil minum obat
  const [streakRows] = await db.execute(
    `
    SELECT DISTINCT DATE(ml.taken_at) AS day
    FROM medication_logs ml
    JOIN medication_schedules ms
      ON ml.schedule_id = ms.id
    JOIN medications m
      ON ms.medication_id = m.id
    WHERE
      m.user_id = ?
      AND ml.status = 'taken'
    ORDER BY day DESC
    `,
    [userId]
  );

  console.log("STREAK DAYS :", streakRows);

  const streak = calculateStreak(streakRows);

  console.log("STREAK :", streak);

  // Hari terapi
  const [therapyStart] = await db.execute(
    `
    SELECT MIN(start_date) AS start_date
    FROM medications
    WHERE user_id = ?
    `,
    [userId]
  );

  const therapyDay = calculateTherapyDay(
    therapyStart[0].start_date
  );

  console.log("THERAPY DAY :", therapyDay);

  console.log("================================");

  const totalTaken = takenLogs[0].total;
  const totalStock = stockData[0].total_stock;

  const TOTAL_THERAPY_DAYS = 180;

  const progress = Math.min(
    100,
    Math.round((therapyDay / TOTAL_THERAPY_DAYS) * 100)
  );

  return {
    today_schedule: todaySchedule,
    total_stock: totalStock,
    total_taken: totalTaken,
    progress,
    streak,
    therapy_day: therapyDay,
  };

};