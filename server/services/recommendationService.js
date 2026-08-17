import db from "../config/db.js";

const addMinutes = (time, minutes) => {
  const [hour, minute] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute + minutes);

  return date.toTimeString().slice(0, 5);
};

export const generateRecommendation = async (userId) => {
  const [routineRows] = await db.execute(
    `
    SELECT *
    FROM user_routines
    WHERE user_id = ?
    `,
    [userId]
  );

  const routine = routineRows[0];

  const [medications] = await db.execute(
    `
    SELECT *
    FROM medications
    WHERE user_id = ?
    ORDER BY id
    `,
    [userId]
  );

  const recommendations = medications.map((med) => {
    let selectedSchedules = med.consumption_schedule;

    if (typeof selectedSchedules === "string") {
      selectedSchedules = JSON.parse(selectedSchedules);
    }

    selectedSchedules = selectedSchedules || [];

    const mapping = {
      before_breakfast: addMinutes(
        routine.breakfast_time,
        -30
      ),

      after_breakfast: addMinutes(
        routine.breakfast_time,
        30
      ),

      before_lunch: addMinutes(
        routine.lunch_time,
        -30
      ),

      after_lunch: addMinutes(
        routine.lunch_time,
        30
      ),

      before_dinner: addMinutes(
        routine.dinner_time,
        -30
      ),

      after_dinner: addMinutes(
        routine.dinner_time,
        30
      ),

      before_sleep: addMinutes(
        routine.sleep_time,
        -30
      ),
    };

    const recommended_times = selectedSchedules
      .map((schedule) => mapping[schedule])
      .filter(Boolean);

    return {
      ...med,
      recommended_time: recommended_times[0] || null,
      recommended_times,
    };
  });

  return {
    routine,
    medications: recommendations,
  };
};

export const saveRecommendation = async (userId) => {
  const result = await generateRecommendation(userId);

  for (const med of result.medications) {
    console.log("================================");
    console.log("MED :", med.med_name);
    console.log("MEDICATION ID :", med.id);
    console.log("TIMES :", med.recommended_times);

    const [schedules] = await db.execute(
      `
      SELECT id
      FROM medication_schedules
      WHERE medication_id = ?
      ORDER BY id ASC
      `,
      [med.id]
    );

    console.log("SCHEDULES :", schedules);

    for (
      let i = 0;
      i < schedules.length && i < med.recommended_times.length;
      i++
    ) {
      await db.execute(
        `
        UPDATE medication_schedules
        SET scheduled_time = ?
        WHERE id = ?
        `,
        [
          med.recommended_times[i],
          schedules[i].id,
        ]
      );
    }
  }

  return true;
};