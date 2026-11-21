import { generateChatResponse } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const sendMessage = async (req, res) => {
    console.log("CHAT ROUTE TERPANGGIL");

    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return errorResponse(
                res,
                "Pesan percakapan tidak boleh kosong.",
                400
            );
        }

        if (messages.length > 30) {
            return errorResponse(
                res,
                "Riwayat percakapan terlalu panjang.",
                400
            );
        }

        const validMessages = messages.every(
            (message) =>
                ["user", "ai"].includes(message.sender) &&
                typeof message.text === "string" &&
                message.text.trim().length > 0 &&
                message.text.length <= 2000
        );

        if (!validMessages) {
            return errorResponse(
                res,
                "Format pesan tidak valid.",
                400
            );
        }

        const answer = await generateChatResponse(messages);

        return successResponse(res, "Respons AI berhasil dibuat.", {
            answer,
        });
    } catch (error) {
        console.error("CHAT CONTROLLER ERROR:", error);

        return errorResponse(
            res,
            "AI Treatment Companion sedang mengalami gangguan. Silakan coba lagi.",
            502
        );
    }
};