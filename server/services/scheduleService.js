import db from "../config/db.js";

export const createSchedule = async (
  medicationId,
  scheduledTime
) => {
  const [result] = await db.execute(
    `INSERT INTO medication_schedules
    (
      medication_id,
      scheduled_time
    )
    VALUES (?, ?)`,
    [
      medicationId,
      scheduledTime,
    ]
  );

  return getScheduleById(result.insertId);
};

export const getAllSchedules = async (
  userId
) => {
  const [rows] = await db.execute(
    `SELECT
        ms.id,
        ms.medication_id,
        ms.scheduled_time,
        m.med_name
     FROM medication_schedules ms
     JOIN medications m
        ON ms.medication_id = m.id
     WHERE m.user_id = ?
     ORDER BY ms.id DESC`,
    [userId]
  );

  return rows;
};

export const getScheduleById = async (
  id
) => {
  const [rows] = await db.execute(
    `SELECT
        ms.id,
        ms.medication_id,
        ms.scheduled_time,
        m.med_name
     FROM medication_schedules ms
     JOIN medications m
        ON ms.medication_id = m.id
     WHERE ms.id = ?`,
    [id]
  );

  return rows[0];
};

export const updateSchedule = async (
  id,
  scheduledTime
) => {
  await db.execute(
    `UPDATE medication_schedules
     SET scheduled_time = ?
     WHERE id = ?`,
    [
      scheduledTime,
      id,
    ]
  );

  return getScheduleById(id);
};

export const deleteSchedule = async (
  id
) => {
  await db.execute(
    `DELETE
     FROM medication_schedules
     WHERE id = ?`,
    [id]
  );
};