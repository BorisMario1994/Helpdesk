// utils/handleFileUpload.ts
import fs from "fs";
import path from "path";
import { Request } from "express";

/**
 * Save a single uploaded file after database insertion
 * @param req - Express request (must contain req.file)
 * @param nomor - ID used as folder name
 * @returns Full path of saved file, or null if no file
 */

// Function to upload file and save it on server file system ("uploads" folder)
export async function uploadFile(req: Request, type: string, nomor: string): Promise<string | null> {
  const file = req.file as Express.Multer.File;
  if (!file) return null;

  const uploadDir = path.join(__dirname, "uploads", type, nomor);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);

  let finalFileName = file.originalname;
  let filePath = path.join(uploadDir, finalFileName);
  let counter = 1;
  // Find an available filename by appending (1), (2), etc.
  while (fs.existsSync(filePath)) {
    finalFileName = `${baseName} (${counter})${ext}`;
    filePath = path.join(uploadDir, finalFileName);
    counter++;
  }

  await fs.promises.writeFile(filePath, file.buffer);

  return finalFileName;
}

// Function to delete existing file from "uploads" folder
export async function deleteFile(type: string, nomor: string, fileName: string) {
  const oldFilePath = path.join(__dirname, "uploads", type, nomor, fileName);
  if (fs.existsSync(oldFilePath))
    fs.unlinkSync(oldFilePath);
}

