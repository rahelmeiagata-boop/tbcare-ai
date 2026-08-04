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
    const rule = med.consumption_rule.toLowerCase();

    let recommended_time = routine.breakfast_time.slice(0, 5);

    switch (rule) {
      case "sebelum sarapan":
      case "sebelum makan":
        recommended_time = addMinutes(
          routine.breakfast_time,
          -30
        );
        break;

      case "sesudah sarapan":
      case "setelah sarapan":
      case "sesudah makan":
      case "setelah makan":
        recommended_time = addMinutes(
          routine.breakfast_time,
          30
        );
        break;

      case "sebelum makan siang":
        recommended_time = addMinutes(
          routine.lunch_time,
          -30
        );
        break;

      case "sesudah makan siang":
      case "setelah makan siang":
        recommended_time = addMinutes(
          routine.lunch_time,
          30
        );
        break;

      case "sebelum makan malam":
        recommended_time = addMinutes(
          routine.dinner_time,
          -30
        );
        break;

      case "sesudah makan malam":
      case "setelah makan malam":
        recommended_time = addMinutes(
          routine.dinner_time,
          30
        );
        break;

      case "sebelum tidur":
        recommended_time = addMinutes(
          routine.sleep_time,
          -30
        );
        break;

      default:
        recommended_time = routine.breakfast_time.slice(0, 5);
        break;
    }

    return {
      ...med,
      recommended_time,
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
    console.log("TIME :", med.recommended_time);

    const [updateResult] = await db.execute(
      `
      UPDATE medication_schedules
      SET scheduled_time = ?
      WHERE medication_id = ?
      `,
      [
        med.recommended_time,
        med.id,
      ]
    );

    console.log("UPDATE RESULT :", updateResult);
  }

  return true;
};