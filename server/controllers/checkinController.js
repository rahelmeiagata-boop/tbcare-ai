import db from "../config/db.js";
import {
    successResponse,
    errorResponse,
} from "../utils/response.js";

export const save = async (req, res) => {
    try {
        const {
            date,
            condition,
            complaints,
            difficulty,
            notes,
        } = req.body;

        if (!condition || !date) {
            return errorResponse(
                res,
                "Tanggal dan kondisi wajib diisi."
            );
        }

        await db.execute(
            `
            INSERT INTO daily_checkins
            (
                user_id,
                checkin_date,
                condition_status,
                complaints,
                difficulty,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                condition_status = VALUES(condition_status),
                complaints = VALUES(complaints),
                difficulty = VALUES(difficulty),
                notes = VALUES(notes)
            `,
            [
                req.user.id,
                date,
                condition,
                complaints || null,
                difficulty || null,
                notes || null,
            ]
        );

        successResponse(
            res,
            "Check-in berhasil disimpan."
        );
    } catch (err) {
        console.error(err);
        errorResponse(res, err.message);
    }
};

export const get = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `
    SELECT
        id,
        DATE_FORMAT(checkin_date, '%Y-%m-%d') AS date,
        condition_status AS \`condition\`,
        complaints,
        difficulty,
        notes,
        created_at AS createdAt
    FROM daily_checkins
    WHERE user_id = ?
    ORDER BY checkin_date DESC
    `,
            [req.user.id]
        );

        successResponse(
            res,
            "Riwayat check-in berhasil diambil.",
            rows
        );
    } catch (err) {
        console.error(err);
        errorResponse(res, err.message);
    }
};