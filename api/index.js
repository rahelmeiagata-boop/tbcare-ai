import app from "../server/app.js";

export default function handler(req, res) {
    const originalPath = req.query.path;

    if (originalPath) {
        const cleanPath = String(originalPath).replace(/^\/+/, "");
        req.url = `/api/${cleanPath}`;
    }

    return app(req, res);
}