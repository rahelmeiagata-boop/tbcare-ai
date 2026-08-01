import db from "../config/db.js";

export const createMedication = async (userId, data) => {
  const {
    med_name,
    dosage,
    frequency,
    duration_days,
    stock,
    consumption_rule,
  } = data;

  const [result] = await db.execute(
    `INSERT INTO medications
    (
      user_id,
      med_name,
      dosage,
      frequency,
      duration_days,
      stock,
      consumption_rule
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      med_name,
      dosage,
      frequency,
      duration_days,
      stock,
      consumption_rule,
    ]
  );

  return getMedicationById(result.insertId, userId);
};

export const getAllMedications = async (userId) => {
  const [rows] = await db.execute(
    `SELECT *
     FROM medications
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId]
  );

  return rows;
};

export const getMedicationById = async (id, userId) => {
  const [rows] = await db.execute(
    `SELECT *
     FROM medications
     WHERE id = ?
     AND user_id = ?`,
    [id, userId]
  );

  return rows[0];
};

export const updateMedication = async (
  id,
  userId,
  data
) => {
  const {
    med_name,
    dosage,
    frequency,
    duration_days,
    stock,
    consumption_rule,
  } = data;

  await db.execute(
    `UPDATE medications
     SET
      med_name=?,
      dosage=?,
      frequency=?,
      duration_days=?,
      stock=?,
      consumption_rule=?
     WHERE id=?
     AND user_id=?`,
    [
      med_name,
      dosage,
      frequency,
      duration_days,
      stock,
      consumption_rule,
      id,
      userId,
    ]
  );

  return getMedicationById(id, userId);
};

export const deleteMedication = async (
  id,
  userId
) => {
  await db.execute(
    `DELETE
     FROM medications
     WHERE id=?
     AND user_id=?`,
    [id, userId]
  );
};