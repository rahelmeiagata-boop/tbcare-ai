import db from "../config/db.js";

export const createLog = async (
  scheduleId,
  status
) => {
  const [result] = await db.execute(
    `INSERT INTO medication_logs
    (
      schedule_id,
      status
    )
    VALUES (?, ?)`,
    [
      scheduleId,
      status,
    ]
  );

  return getLogById(result.insertId);
};

export const getAllLogs = async () => {
  const [rows] = await db.execute(
    `SELECT
      ml.id,
      ml.schedule_id,
      ml.status,
      ml.taken_at,
      ms.scheduled_time,
      m.med_name
    FROM medication_logs ml
    JOIN medication_schedules ms
      ON ml.schedule_id = ms.id
    JOIN medications m
      ON ms.medication_id = m.id
    ORDER BY ml.id DESC`
  );

  return rows;
};

export const getLogById = async (
  id
) => {
  const [rows] = await db.execute(
    `SELECT
      ml.id,
      ml.schedule_id,
      ml.status,
      ml.taken_at,
      ms.scheduled_time,
      m.med_name
    FROM medication_logs ml
    JOIN medication_schedules ms
      ON ml.schedule_id = ms.id
    JOIN medications m
      ON ms.medication_id = m.id
    WHERE ml.id = ?`,
    [id]
  );

  return rows[0];
};

export const updateLog = async (
  id,
  status
) => {
  await db.execute(
    `UPDATE medication_logs
     SET status = ?
     WHERE id = ?`,
    [
      status,
      id,
    ]
  );

  return getLogById(id);
};

export const deleteLog = async (
  id
) => {
  await db.execute(
    `DELETE
     FROM medication_logs
     WHERE id = ?`,
    [id]
  );
};