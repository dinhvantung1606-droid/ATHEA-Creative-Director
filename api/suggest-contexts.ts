import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getMimeType = (base64: string) => {
  if (base64.startsWith("data:image/png")) return "image/png";
  if (base64.startsWith("data:image/jpeg")) return "image/jpeg";
  if (base64.startsWith("data:image/webp")) return "image/webp";
  return "image/jpeg";
};

const stripBase64Prefix = (base64: string) =>
  base64.replace(/^data:image\/[a-z]+;base64,/, "");

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const imagePart = {
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: stripBase64Prefix(imageBase64),
      },
    };

    const prompt = `
Bạn là Giám đốc Sáng tạo trong lĩnh vực thời trang cao cấp.
Hãy phân tích hình ảnh sản phẩm được cung cấp và đề xuất 5 bối cảnh chụp ảnh (Shooting Context)
sáng tạo, phù hợp để làm nổi bật sản phẩm.

YÊU CẦU:
- Trả về KẾT QUẢ DUY NHẤT là một JSON Array
- Mỗi phần tử là một chuỗi Tiếng Việt
- KHÔNG thêm mô tả, KHÔNG markdown

Ví dụ:
["Studio phông nền màu be", "Đường phố Paris ngày nắng", "Nội thất gỗ ấm cúng"]
    `;

    const result = await model.generateContent({
      contents: {
        parts: [imagePart, { text: prompt }],
      },
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const contexts = JSON.parse(text);

    return res.status(200).json({ contexts });
  } catch (error: any) {
    console.error("suggest-contexts error:", error);
    return res.status(500).json({
      error: "Failed to generate contexts",
      detail: error?.message || String(error),
    });
  }
}
