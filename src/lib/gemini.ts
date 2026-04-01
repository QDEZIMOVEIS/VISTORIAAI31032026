import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRoomMedia(base64Data: string, mimeType: string, userNotes?: string) {
  try {
    const isVideo = mimeType.startsWith('video/');
    const prompt = `Analise este ${isVideo ? 'vídeo' : 'foto'} de um ambiente de imóvel para vistoria imobiliária.
            ${userNotes ? `Considere estas observações do vistoriador: "${userNotes}"` : ''}
            Identifique o ambiente (ex: Sala, Cozinha, Banheiro).
            Descreva o ambiente de forma técnica e objetiva (ex: "Paredes com pintura látex branca, piso cerâmico 60x60, teto com moldura de gesso").
            Detecte sinais aparentes de infiltração, mofo, rachaduras, pintura danificada, ferrugem, danos em portas, janelas, pisos, louças, metais.
            Classifique o estado de conservação em: Novo, Bom, Regular, Ruim ou Impróprio para uso.
            Para cada dano detectado, sugira:
            1. O item e o problema.
            2. Responsabilidade: Locador (desgaste natural ou estrutural) ou Locatário (mau uso ou falta de manutenção).
            3. Custo estimado de reparo baseado na tabela SINAPI do Estado de São Paulo (Material + Mão de Obra).
            Retorne em JSON estrito.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomType: { type: Type.STRING, description: "Tipo do ambiente" },
            technicalDescription: { type: Type.STRING, description: "Descrição técnica" },
            detectedIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  responsibility: { type: Type.STRING, enum: ["Locador", "Locatário", "N/A"] },
                  estimatedCost: { type: Type.NUMBER, description: "Custo estimado (SINAPI SP)" }
                }
              }
            },
            conservationState: { type: Type.STRING, enum: ["Novo", "Bom", "Regular", "Ruim", "Impróprio para uso"] }
          },
          required: ["roomType", "technicalDescription", "conservationState"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Transcreva este áudio de observações de vistoria imobiliária para texto.",
          },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    return null;
  }
}
