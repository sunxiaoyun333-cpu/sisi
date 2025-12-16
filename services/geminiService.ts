import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, KnowledgeItem } from "../types";
import { INITIAL_KNOWLEDGE_BASE, SYSTEM_PROMPT_TEMPLATE } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a message to the Gemini model with the current context and knowledge base.
 */
export const sendMessageToGemini = async (
  history: Message[],
  extraKnowledge: KnowledgeItem[]
): Promise<string> => {
  try {
    // Construct the full knowledge base string
    let fullKnowledgeBase = INITIAL_KNOWLEDGE_BASE;
    
    if (extraKnowledge.length > 0) {
      fullKnowledgeBase += "\n\n**补充知识库 (Added Knowledge):**\n";
      extraKnowledge.forEach((item, index) => {
        fullKnowledgeBase += `${index + 1000}. **${item.question}**\n   * ${item.answer}\n`;
      });
    }

    const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace('{{KNOWLEDGE_BASE}}', fullKnowledgeBase);

    // Filter history to conform to Gemini format (user/model roles only)
    const validHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // The last message is the new one, remove it from history to pass as 'contents' logic if using chat session,
    // but here we use single turn generation with full context for simplicity in stateless-like REST behavior,
    // OR use chat session. Let's use `generateContent` with strict system instructions for RAG consistency.
    
    const lastUserMessage = validHistory[validHistory.length - 1].parts[0].text;
    const historyContext = validHistory.slice(0, -1); // Previous context

    // For better RAG performance in a single turn, we concatenate history into the prompt 
    // or use the chat model. Let's use the Chat model.
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual RAG
      },
      history: historyContext
    });

    const response = await chat.sendMessage({ message: lastUserMessage });
    return response.text || "抱歉，我无法生成回答。";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "系统繁忙，请稍后再试。 (API Error)";
  }
};

/**
 * Extracts Q&A pairs from a document (text or image) using Gemini.
 */
export const extractKnowledgeFromDoc = async (
  fileBase64: string,
  mimeType: string
): Promise<KnowledgeItem[]> => {
  try {
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The technical question extracted from the text." },
          answer: { type: Type.STRING, description: "The answer to the question." }
        },
        required: ["question", "answer"]
      }
    };

    const prompt = "你是一位技术文档专家。分析这份文档并提取所有有用的技术支持问答对 (Q&A)。忽略无关信息。务必用中文提取。结果以 JSON 数组形式返回。";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    if (response.text) {
      const parsedData = JSON.parse(response.text) as KnowledgeItem[];
      return parsedData;
    }
    
    return [];

  } catch (error) {
    console.error("Knowledge Extraction Error:", error);
    throw new Error("解析文档失败，请重试。");
  }
};