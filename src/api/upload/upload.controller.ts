import fs from "fs";
import sharp from "sharp";
import { Request, Response } from "express";

export async function uploadFile(req: Request, res: Response) {
  console.log("image upload called");
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "이미지 파일만 업로드할 수 있거나 파일이 선택되지 않았습니다.",
      });
    }

    // 업로드된 파일의 width, height 추출
    const buffer = fs.readFileSync(req.file.path);
    const metadata = await sharp(buffer).metadata();

    // 클라이언트가 접근할 정적 URL 생성
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    return res.status(200).json({
      url: fileUrl,
      width: metadata.width || null,
      height: metadata.height || null,
    });
  } catch (error) {
    console.error("이미지 업로드 에러:", error);
    return res
      .status(500)
      .json({ error: "이미지 처리 중 오류가 발생했습니다." });
  }
}
