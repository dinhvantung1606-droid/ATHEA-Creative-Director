import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1],
              },
            },
            {
              text: `
Bạn là Giám đốc Sáng tạo thời trang.
Hãy đề xuất 5 phong cách người mẫu phù hợp nhất với sản phẩm trong ảnh.
Ưu tiên các phong cách:
- Người mẫu Việt Nam
- Người mẫu Hàn Quốc
- Người mẫu Trung Quốc
- Âu Mỹ / High Fashion

Trả về KẾT QUẢ DUY NHẤT là một JSON ARRAY, ví dụ:
[
  "Người mẫu Việt Nam – Thanh lịch, hiện đại",
  "Người mẫu Hàn Quốc – Da sáng, phong cách nhẹ nhàng",
  "Người mẫu Trung Quốc – Thần thái sắc sảo, high-fashion",
  "Người mẫu Âu Mỹ – Editorial, cá tính",
  "Người mẫu Gen Z – Street style thời trang"
]
              `,
            },
          ],
        },
      ],
    });

    const text = result.response.text();
    const styles = JSON.parse(text);

    return res.status(200).json({ styles });
  } catch (error: any) {
    console.error("suggest-model-styles error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}

