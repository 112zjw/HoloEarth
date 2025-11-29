import { GoogleGenAI, Type } from "@google/genai";
import { GeoFact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一个未来派全息行星界面的AI核心。
你的目标是提供关于地球的简明、科学准确且引人入胜的科普内容。
请始终使用中文回答。
语气要稍微带点机械感，但非常有帮助，就像科幻飞船上的主控电脑。
专注于地理、气候、地质、生态或该特定位置的人文影响。
`;

export const getPlanetaryIntel = async (lat: number, lng: number): Promise<GeoFact> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `分析目标坐标: 纬度 ${lat.toFixed(2)}, 经度 ${lng.toFixed(2)}。

      指令:
      1. 识别该坐标位于陆地还是海洋。
      2. 如果是陆地，指出最近的国家、城市或著名地貌（如山脉、沙漠、森林）。
      3. 如果是海洋，指出洋流、海沟或该海域的特点。
      4. 提供一个关于该区域的"科普事实"。

      请以JSON格式返回，包含标题(title)和内容(content)。`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "简短的标题，例如'马里亚纳海沟'或'撒哈拉沙漠'。" },
            content: { type: Type.STRING, description: "关于该位置的2-3句科普介绍。" },
          },
          required: ["title", "content"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 数据流为空");
    
    const data = JSON.parse(text) as GeoFact;
    data.coordinates = { lat, lng };
    return data;
  } catch (error) {
    console.error("Gemini Intel Error:", error);
    return {
      title: "连接中断",
      content: "无法建立与行星数据库的连接，请重新扫描目标区域。",
    };
  }
};