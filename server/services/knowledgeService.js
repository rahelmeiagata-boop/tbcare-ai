import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const storeName = process.env.GEMINI_FILE_SEARCH_STORE;

export const uploadKnowledgeDocument = async ({
    buffer,
    fileName,
    title,
}) => {
    if (!storeName) {
        throw new Error("GEMINI_FILE_SEARCH_STORE belum dikonfigurasi.");
    }

    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("File PDF tidak valid.");
    }

    const pdfBlob = new Blob([buffer], {
        type: "application/pdf",
    });

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: storeName,
        file: pdfBlob,
        config: {
            mimeType: "application/pdf",
            displayName: title || fileName,
            chunkingConfig: {
                whiteSpaceConfig: {
                    maxTokensPerChunk: 200,
                    maxOverlapTokens: 20,
                },
            },
        },
    });

    let attempts = 0;

    while (!operation.done && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        operation = await ai.operations.get({
            operation,
        });

        attempts++;
    }

    if (!operation.done) {
        throw new Error("Pemrosesan dokumen terlalu lama.");
    }

    if (operation.error) {
        throw new Error(operation.error.message);
    }

    const documentName = operation.response?.documentName;

    if (!documentName) {
        throw new Error("ID dokumen Gemini tidak ditemukan.");
    }

    return {
        documentName,
        storeName,
    };
};

export const deleteKnowledgeDocument = async (documentName) => {
    if (!storeName) {
        throw new Error("GEMINI_FILE_SEARCH_STORE belum dikonfigurasi.");
    }

    if (
        typeof documentName !== "string" ||
        !documentName.startsWith(`${storeName}/documents/`)
    ) {
        throw new Error("ID dokumen Gemini tidak valid.");
    }

    await ai.fileSearchStores.documents.delete({
        name: documentName,
        config: {
            force: true,
        },
    });

    return true;
};