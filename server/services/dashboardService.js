import db from "../config/db.js";

export const getDashboardData = async (userId) => {
  console.log("================================");
  console.log("USER ID :", userId);

  // Jadwal obat
  const [todaySchedule] = await db.execute(
    `SELECT
        ms.id,
        ms.scheduled_time,
        m.med_name
     FROM medication_schedules ms
     JOIN medications m
       ON ms.medication_id = m.id
     WHERE m.user_id = ?
     ORDER BY ms.scheduled_time ASC`,
    [userId]
  );

  console.log("TODAY SCHEDULE :", todaySchedule);

  // Total obat
  const [totalMedication] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM medications
     WHERE user_id = ?`,
    [userId]
  );

  console.log("TOTAL MEDICATION :", totalMedication);

  // Total log diminum
  const [takenLogs] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM medication_logs ml
     JOIN medication_schedules ms
       ON ml.schedule_id = ms.id
     JOIN medications m
       ON ms.medication_id = m.id
     WHERE
       m.user_id = ?
       AND ml.status = 'taken'`,
    [userId]
  );

  console.log("TAKEN LOGS :", takenLogs);
  console.log("================================");

  const totalTaken = takenLogs[0].total;
  const totalMedicine = totalMedication[0].total;

  const progress =
    totalMedicine === 0
      ? 0
      : Math.round((totalTaken / totalMedicine) * 100);

  return {
    today_schedule: todaySchedule,
    total_medications: totalMedicine,
    total_taken: totalTaken,
    progress,
  };
};