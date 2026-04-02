import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRoomMedia(base64Data: string, mimeType: string, userNotes?: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in environment variables.");
    return { error: "API Key ausente. Verifique as configurações no Google Cloud Console / AI Studio." };
  }

  try {
    const isVideo = mimeType.startsWith('video/');
    const prompt = `Analise este ${isVideo ? 'vídeo' : 'foto'} de um ambiente de imóvel para vistoria imobiliária.
            ${userNotes ? `Considere estas observações do vistoriador: "${userNotes}"` : ''}
            Identifique o ambiente (ex: Sala, Cozinha, Banheiro).
            Descreva o ambiente de forma técnica e objetiva (ex: "Paredes com pintura látex branca, piso cerâmico 60x60, teto com moldura de gesso").
            Detecte sinais aparentes de infiltração, mofo, rachaduras, pintura danificada, ferrugem, danos em portas, janelas, pisos, louças, metais.
            Classifique o estado de conservação em: Novo, Bom, Regular, Ruim ou Impróprio para uso.
            Para cada dano detectado, forneça um orçamento detalhado:
            1. O item e o problema.
            2. Responsabilidade: Locador (desgaste natural ou estrutural) ou Locatário (mau uso ou falta de manutenção).
            3. O orçamento DEVE ser baseado na tabela vigente SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP.
            4. Prevaleça SEMPRE o menor valor entre a Tabela SINAPI e os preços da Região.
            5. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA.
            6. Apresente a FONTE do valor (nome da loja ou empresa de prestação de serviços).
            Retorne em JSON estrito.`;

    console.log(`[Gemini] Iniciando análise multimodal (${mimeType})...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Upgraded to Pro for better multimodal reasoning
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
                  materialCost: { type: Type.NUMBER, description: "Custo de material (SINAPI/SP ou Ribeirão Preto)" },
                  laborCost: { type: Type.NUMBER, description: "Custo de mão de obra (SINAPI/SP ou Ribeirão Preto)" },
                  totalCost: { type: Type.NUMBER, description: "Custo total (Material + Mão de Obra)" },
                  source: { type: Type.STRING, description: "Fonte do valor (ex: SINAPI/SP, Loja X)" }
                }
              }
            },
            conservationState: { type: Type.STRING, enum: ["Novo", "Bom", "Regular", "Ruim", "Impróprio para uso"] }
          },
          required: ["roomType", "technicalDescription", "conservationState"]
        }
      }
    });

    if (!response.text) {
      console.error("[Gemini] Resposta vazia da IA.");
      return { error: "A IA retornou uma resposta vazia. Pode ser um filtro de segurança ou erro temporário." };
    }

    console.log("[Gemini] Resposta recebida com sucesso.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return { error: error?.message || "Erro desconhecido na análise da IA." };
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
