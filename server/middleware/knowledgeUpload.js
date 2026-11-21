import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const isPDF =
        file.mimetype === "application/pdf" &&
        file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
        return cb(new Error("Hanya file PDF yang diperbolehkan."));
    }

    cb(null, true);
};

const uploadKnowledge = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 10,
    },
});

export default uploadKnowledge;