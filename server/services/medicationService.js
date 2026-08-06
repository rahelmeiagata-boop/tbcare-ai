import db from "../config/db.js";

const addMinutes = (time, minutes) => {
  const [hour, minute] = time.split(":").map(Number);

  const date = new Date();

  date.setHours(hour);
  date.setMinutes(minute + minutes);
  date.setSeconds(0);

  return date.toTimeString().slice(0, 8);
};

const generateScheduleTimes = (selectedSchedules, routine) => {
  const mapping = {
    before_breakfast: addMinutes(routine.breakfast_time, -30),
    after_breakfast: addMinutes(routine.breakfast_time, 30),

    before_lunch: addMinutes(routine.lunch_time, -30),
    after_lunch: addMinutes(routine.lunch_time, 30),

    before_dinner: addMinutes(routine.dinner_time, -30),
    after_dinner: addMinutes(routine.dinner_time, 30),

    before_sleep: addMinutes(routine.sleep_time, -30),
  };

  return selectedSchedules.map((item) => mapping[item]);
};

export const createMedication = async (userId, data) => {
  const {
    med_name,
    dosage,
    frequency,
    duration_days,
    stock,
    consumption_rule,
    consumption_schedule,
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
      consumption_rule,
      consumption_schedule
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      med_name,
      dosage,
      frequency,
      duration_days,
      stock,
      consumption_rule,
      JSON.stringify(consumption_schedule),
    ]
  );

  const medicationId = result.insertId;

  const [routineRows] = await db.execute(
    `
    SELECT *
    FROM user_routines
    WHERE user_id = ?
    `,
    [userId]
  );

  if (routineRows.length > 0) {
    const routine = routineRows[0];

    const schedules = generateScheduleTimes(
      consumption_schedule,
      routine
    );

    for (const time of schedules) {
      await db.execute(
        `
        INSERT INTO medication_schedules
        (
          medication_id,
          scheduled_time
        )
        VALUES (?, ?)
        `,
        [medicationId, time]
      );
    }
  }

  return getMedicationById(medicationId, userId);
};

export const getAllMedications = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT *
    FROM medications
    WHERE user_id = ?
    ORDER BY id DESC
    `,
    [userId]
  );

  return rows.map((item) => {

    console.log(item.med_name);
    console.log(item.consumption_schedule);

    return {
      ...item,
      consumption_schedule:
        typeof item.consumption_schedule === "string"
          ? JSON.parse(item.consumption_schedule)
          : item.consumption_schedule ?? [],
    };
  });
};

export const getMedicationById = async (id, userId) => {
  const [rows] = await db.execute(
    `
    SELECT *
    FROM medications
    WHERE id = ?
    AND user_id = ?
    `,
    [id, userId]
  );

  if (!rows.length) return null;

  return {
    ...rows[0],
    consumption_schedule:
      typeof rows[0].consumption_schedule === "string"
        ? JSON.parse(rows[0].consumption_schedule)
        : rows[0].consumption_schedule ?? [],
  };
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
    consumption_schedule,
  } = data;

  await db.execute(
    `
    UPDATE medications
    SET
      med_name=?,
      dosage=?,
      frequency=?,
      duration_days=?,
      stock=?,
      consumption_rule=?,
      consumption_schedule=?
    WHERE id=?
    AND user_id=?
    `,
    [
      med_name,
      dosage,
      frequency,
      duration_days,
      stock,
      consumption_rule,
      JSON.stringify(consumption_schedule),
      id,
      userId,
    ]
  );

  await db.execute(
    `
    DELETE FROM medication_schedules
    WHERE medication_id=?
    `,
    [id]
  );

  const [routineRows] = await db.execute(
    `
    SELECT *
    FROM user_routines
    WHERE user_id=?
    `,
    [userId]
  );

  if (routineRows.length > 0) {
    const schedules = generateScheduleTimes(
      consumption_schedule,
      routineRows[0]
    );

    for (const time of schedules) {
      await db.execute(
        `
        INSERT INTO medication_schedules
        (
          medication_id,
          scheduled_time
        )
        VALUES (?, ?)
        `,
        [id, time]
      );
    }
  }

  return getMedicationById(id, userId);
};

export const deleteMedication = async (id, userId) => {
  await db.execute(
    `
    DELETE FROM medications
    WHERE id=?
    AND user_id=?
    `,
    [id, userId]
  );
};

export const takeMedicine = async (scheduleId) => {
  console.log("TAKE MEDICINE:", scheduleId);

  // Simpan log
  await db.execute(
    `
    INSERT INTO medication_logs
    (
      schedule_id,
      status,
      taken_at
    )
    VALUES
    (
      ?,
      'taken',
      NOW()
    )
    `,
    [scheduleId]
  );

  // Cari obat dari jadwal
  const [rows] = await db.execute(
    `
    SELECT medication_id
    FROM medication_schedules
    WHERE id = ?
    `,
    [scheduleId]
  );

  console.log("MEDICATION ROW:", rows);

  if (rows.length > 0) {

    await db.execute(
      `
      UPDATE medications
      SET stock = GREATEST(stock - 1, 0)
      WHERE id = ?
      `,
      [rows[0].medication_id]
    );

    const [check] = await db.execute(
      `
    SELECT id, med_name, stock
    FROM medications
    WHERE id = ?
    `,
      [rows[0].medication_id]
    );

    console.log("SETELAH UPDATE:", check);

  }

};