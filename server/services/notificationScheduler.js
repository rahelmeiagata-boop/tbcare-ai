import db from "../config/db.js";

const checkMedicationSchedules = async () => {
  try {
    const now = new Date();

    const jakartaTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const [schedules] = await db.execute(
      `
      SELECT
        ms.id AS schedule_id,
        ms.scheduled_time,
        m.id AS medication_id,
        m.med_name,
        m.user_id
      FROM medication_schedules ms
      JOIN medications m
        ON ms.medication_id = m.id
      WHERE TIME_FORMAT(ms.scheduled_time, '%H:%i') = ?
      `,
      [jakartaTime]
    );

    for (const schedule of schedules) {
      const message =
        `Waktunya minum ${schedule.med_name}. ` +
        `Silakan minum obat sesuai jadwal Anda.`;

      const [existing] = await db.execute(
        `
        SELECT id
        FROM notifications
        WHERE user_id = ?
          AND message = ?
          AND DATE(created_at) = CURDATE()
        LIMIT 1
        `,
        [
          schedule.user_id,
          message,
        ]
      );

      if (existing.length > 0) {
        continue;
      }

      await db.execute(
        `
        INSERT INTO notifications
        (
          user_id,
          message,
          channel,
          status,
          is_read
        )
        VALUES
        (
          ?,
          ?,
          'whatsapp',
          'menunggu',
          0
        )
        `,
        [
          schedule.user_id,
          message,
        ]
      );

      console.log(
        `NOTIF OTOMATIS: ${schedule.med_name} -> user ${schedule.user_id}`
      );
    }
  } catch (error) {
    console.error(
      "NOTIFICATION SCHEDULER ERROR:",
      error
    );
  }
};

const startNotificationScheduler = () => {
  console.log(
    "Notification scheduler aktif."
  );

  checkMedicationSchedules();

  setInterval(
    checkMedicationSchedules,
    30 * 1000
  );
};

export default startNotificationScheduler;