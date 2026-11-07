import db from "../config/db.js";
import {
    createNotification,
    getNotifications,
    markNotificationAsRead,
} from "../services/notificationService.js";

import {
    successResponse,
    errorResponse,
} from "../utils/response.js";

export const sendReminder = async (req, res) => {
    try {
        const { user_id, message } = req.body;
        const familyId = req.user.id;

        if (!user_id || !message) {
            return errorResponse(
                res,
                "User ID dan pesan wajib diisi."
            );
        }

        // Periksa hubungan pendamping dan pasien
        const [connections] = await db.execute(
            `
            SELECT id
            FROM family_connections
            WHERE patient_id = ?
            AND family_id = ?
            `,
            [user_id, familyId]
        );

        if (connections.length === 0) {
            return errorResponse(
                res,
                "Pasien tidak terhubung dengan akun pendamping ini.",
                403
            );
        }

        const result = await createNotification(
            user_id,
            message
        );

        return successResponse(
            res,
            result.message,
            result
        );

    } catch (err) {
        console.error("SEND REMINDER ERROR:", err);
        return errorResponse(res, err.message);
    }
};

export const getMyNotifications = async (
    req,
    res
) => {
    try {
        const notifications =
            await getNotifications(
                req.user.id
            );

        successResponse(
            res,
            "Notifikasi berhasil diambil.",
            notifications
        );
    } catch (err) {
        errorResponse(
            res,
            err.message
        );
    }
};

export const markAsRead = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        await markNotificationAsRead(
            id,
            req.user.id
        );

        successResponse(
            res,
            "Notifikasi ditandai sudah dibaca."
        );
    } catch (err) {
        errorResponse(
            res,
            err.message
        );
    }
};