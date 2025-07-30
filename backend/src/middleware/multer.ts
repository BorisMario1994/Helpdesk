import multer from "multer";

// Use memory storage so we can control file saving ourselves
export const upload = multer({ storage: multer.memoryStorage() });
