import db from "../config/db.js";

const addMinutes = (time, minutes) => {
    const [hour, minute] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute + minutes);
    date.setSeconds(0);

    return date.toTimeString().slice(0, 8);
};

const generateScheduleTimes = (
    consumptionSchedule = [],
    routine
) => {
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

    return consumptionSchedule
        .map((item) => mapping[item])
        .filter(Boolean);
};

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

    await db.execute(sql, values);

    console.log("4. ROUTINE BERHASIL DISIMPAN");

    // Ambil routine terbaru
    const routine = await getRoutine(userId);

    if (!routine) {
        throw new Error("Routine gagal ditemukan setelah disimpan.");
    }

    // Ambil semua obat milik user
    const [medications] = await db.execute(
        `
        SELECT
            id,
            med_name,
            consumption_schedule
        FROM medications
        WHERE user_id = ?
        `,
        [userId]
    );

    console.log(
        "5. JUMLAH OBAT USER :",
        medications.length
    );

    // Buat schedule hanya untuk obat
    // yang belum punya schedule
    for (const medication of medications) {
        const [existingSchedules] = await db.execute(
            `
            SELECT id
            FROM medication_schedules
            WHERE medication_id = ?
            `,
            [medication.id]
        );

        if (existingSchedules.length > 0) {
            console.log(
                `6. ${medication.med_name} sudah punya schedule. Skip.`
            );

            continue;
        }

        let consumptionSchedule =
            medication.consumption_schedule;

        if (typeof consumptionSchedule === "string") {
            try {
                consumptionSchedule =
                    JSON.parse(consumptionSchedule);
            } catch (error) {
                console.error(
                    "Gagal parse consumption_schedule:",
                    medication.id,
                    error
                );

                consumptionSchedule = [];
            }
        }

        const scheduleTimes = generateScheduleTimes(
            consumptionSchedule,
            routine
        );

        console.log(
            `7. ${medication.med_name} ->`,
            scheduleTimes
        );

        for (const scheduledTime of scheduleTimes) {
            await db.execute(
                `
                INSERT INTO medication_schedules
                (
                    medication_id,
                    scheduled_time
                )
                VALUES (?, ?)
                `,
                [
                    medication.id,
                    scheduledTime,
                ]
            );
        }
    }

    console.log("8. SEMUA SCHEDULE SELESAI DIPROSES");

    return getRoutine(userId);
};

export const getRoutine = async (userId) => {
    console.log("9. MASUK GET ROUTINE");

    const [rows] = await db.execute(
        `
        SELECT *
        FROM user_routines
        WHERE user_id = ?
        `,
        [userId]
    );

    console.log("10. HASIL SELECT =", rows);

    return rows[0];
};