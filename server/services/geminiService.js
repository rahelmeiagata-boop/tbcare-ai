import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const storeName = process.env.GEMINI_FILE_SEARCH_STORE;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
}

if (!storeName) {
    throw new Error("GEMINI_FILE_SEARCH_STORE belum dikonfigurasi.");
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Kamu adalah AI Treatment Companion dari TBCare.
Kamu membantu pasien yang sedang menjalani pengobatan tuberkulosis (TB).

Aturan:
1. Jawab selalu dalam Bahasa Indonesia yang sederhana dan ramah.
2. Gunakan informasi dari dokumen TBCare sebagai sumber utama untuk pertanyaan tentang TB.
3. Jangan mengarang informasi atau mengaku menemukan informasi yang tidak tersedia dalam dokumen.
4. Jika informasi tidak ditemukan, sampaikan dengan jujur dan arahkan pengguna bertanya kepada dokter atau petugas TB.
5. Berikan jawaban yang relevan dengan pertanyaan pengguna.
6. Bantu pasien memahami pentingnya mengikuti jadwal pengobatan.
7. Jangan menyuruh pasien menggandakan dosis jika lupa minum obat.
8. Jangan menentukan perubahan dosis atau menghentikan obat.
9. Untuk pertanyaan dosis yang terlupa, arahkan pasien menghubungi dokter atau petugas TB.
10. Jika pasien mengalami sesak napas berat, batuk darah banyak, reaksi alergi berat, atau kondisi darurat, arahkan segera mencari pertolongan medis.
11. Jangan mengaku sebagai dokter.
12. Jawab dengan singkat, jelas, dan empatik.
`;

export const generateChatResponse = async (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("Pesan percakapan tidak boleh kosong.");
    }

    const history = messages.slice(-12).map((message) => ({
        role: message.sender === "ai" ? "model" : "user",
        parts: [{ text: String(message.text || "") }],
    }));

    while (history.length > 0 && history[0].role === "model") {
        history.shift();
    }

    if (history.length === 0) {
        throw new Error("Tidak ada pesan pengguna untuk dikirim ke Gemini.");
    }

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: history,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4,
            maxOutputTokens: 700,
            tools: [
                {
                    fileSearch: {
                        fileSearchStoreNames: [storeName],
                        topK: 5,
                    },
                },
            ],
        },
    });

    const answer = response.text?.trim();

    if (!answer) {
        throw new Error("Gemini tidak memberikan jawaban.");
    }

    return answer;
};