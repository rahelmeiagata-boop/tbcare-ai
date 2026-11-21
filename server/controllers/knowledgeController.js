import db from "../config/db.js";
import {
    uploadKnowledgeDocument,
    deleteKnowledgeDocument,
} from "../services/knowledgeService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const uploadDocument = async (req, res) => {
    const files = req.files || [];

    if (files.length === 0) {
        return errorResponse(res, "Minimal satu file PDF wajib diunggah.", 400);
    }

    const { author, category } = req.body;
    const allowedCategories = ["jurnal", "buku", "pedoman", "lainnya"];

    if (category && !allowedCategories.includes(category)) {
        return errorResponse(res, "Kategori dokumen tidak valid.", 400);
    }

    const results = [];

    for (const file of files) {
        let documentName = null;

        try {
            const title = file.originalname.replace(/\.pdf$/i, "").trim();

            const geminiResult = await uploadKnowledgeDocument({
                buffer: file.buffer,
                fileName: file.originalname,
                title,
            });

            documentName = geminiResult.documentName;

            const [result] = await db.execute(
                `INSERT INTO knowledge_documents
                (title, author, category, file_name, mime_type,
                 file_size, gemini_document_name, status, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title,
                    author?.trim() || null,
                    category || "jurnal",
                    file.originalname,
                    file.mimetype,
                    file.size,
                    documentName,
                    "active",
                    req.user.id,
                ]
            );

            results.push({
                id: result.insertId,
                fileName: file.originalname,
                status: "active",
            });

        } catch (error) {
            console.error(`Gagal memproses ${file.originalname}:`, error);

            if (documentName) {
                try {
                    await deleteKnowledgeDocument(documentName);
                } catch (rollbackError) {
                    console.error("Gagal rollback Gemini:", rollbackError);
                }
            }

            results.push({
                fileName: file.originalname,
                status: "failed",
                message: error.message,
            });
        }
    }

    const successful = results.filter(item => item.status === "active").length;
    const failed = results.length - successful;

    return successResponse(
        res,
        `Upload selesai. ${successful} berhasil dan ${failed} gagal.`,
        {
            total: results.length,
            successful,
            failed,
            results,
        },
        200
    );
};