
import { GoogleGenAI } from "@google/genai";
import { User, UserRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Helps generate a better description based on keywords.
   */
  enhanceDescription: async (description: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `قم بتحسين وصف هذه المشكلة التقنية بأسلوب احترافي ومختصر جداً (جملة أو جملتين): "${description}"`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return description;
    }
  },

  /**
   * Suggests a price range for a bid based on service description.
   */
  suggestPriceRange: async (description: string, category: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `بناءً على هذا الوصف: "${description}" في قسم "${category}"، ما هو نطاق السعر المتوقع (بالدينار الأردني) لهذه الخدمة؟ أجب برقمين فقط (الحد الأدنى والحد الأقصى).`,
      });
      return response.text;
    } catch (error) {
      return "غير متاح";
    }
  },

  /**
   * AI Assistant for general advice and technician recommendations
   */
  askAiAssistant: async (query: string, technicians: User[], userCity?: string) => {
    try {
      const techContext = technicians
        .filter(t => t.approved)
        .map(t => `- ${t.name} (${t.city}) تقييم ${t.rating}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          systemInstruction: `أنت "مساعد ورشه+" الذكي.
          القاعدة الأولى: كن مختصراً جداً. إجاباتك يجب ألا تتجاوز 3 جمل.
          - قدم نصيحة سريعة ومباشرة.
          - اقترح مواد متوفرة في الأردن باختصار.
          - إذا سأل عن فني، رشح الأفضل من القائمة:
          ${techContext}
          - المستخدم في: ${userCity || 'غير محدد'}.
          - تحدث بلهجة أردنية بسيطة.`
        }
      });
      return response.text;
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return "عذراً، في مشكلة بالاتصال. تفضل اسألني.";
    }
  }
};
