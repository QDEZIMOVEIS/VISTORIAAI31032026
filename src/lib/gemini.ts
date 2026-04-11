import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function fetchWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuotaError && i < retries - 1) {
        console.warn(`[Gemini] Quota exceeded (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export async function analyzeRoomMedia(base64Data: string, mimeType: string, userNotes?: string, inspectionType?: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in environment variables.");
    return { error: "API Key ausente. Verifique as configurações no Google Cloud Console / AI Studio." };
  }

  try {
    const isVideo = mimeType.startsWith('video/');
    const isEntry = inspectionType === 'entrada';
    
    const prompt = `Analise este ${isVideo ? 'vídeo' : 'foto'} de um ambiente de imóvel para vistoria imobiliária.
            ${userNotes ? `Considere estas observações do vistoriador: "${userNotes}"` : ''}
            Identifique o ambiente (ex: Sala, Cozinha, Banheiro).
            Descreva o ambiente de forma técnica e objetiva (ex: "Paredes com pintura látex branca, piso cerâmico 60x60, teto com moldura de gesso").
            Detecte sinais aparentes de infiltração, mofo, rachaduras, pintura danificada, ferrugem, danos em portas, janelas, pisos, louças, metais.
            Classifique o estado de conservação em: Novo, Bom, Regular, Ruim ou Impróprio para uso.
            Para cada dano detectado, forneça um orçamento detalhado:
            1. O item e o problema.
            2. Responsabilidade: ${isEntry ? 'NÃO mencione a responsabilidade (use "N/A"), pois esta é uma VISTORIA DE ENTRADA.' : 'Locador (desgaste natural ou estrutural) ou Locatário (mau uso ou falta de manutenção).'}
            3. O orçamento DEVE ser baseado na tabela vigente SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP.
            4. Prevaleça SEMPRE o menor valor entre a Tabela SINAPI e os preços da Região.
            5. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA.
            6. Apresente a FONTE do valor (nome da loja ou empresa de prestação de serviços).
            Retorne em JSON estrito.`;

    console.log(`[Gemini] Iniciando análise multimodal (${mimeType})...`);
    
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", // Switched to Flash for better quota and speed
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
    }));

    if (!response.text) {
      console.error("[Gemini] Resposta vazia da IA.");
      return { error: "A IA retornou uma resposta vazia. Pode ser um filtro de segurança ou erro temporário." };
    }

    console.log("[Gemini] Resposta recebida com sucesso.");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return { error: "Limite de uso da IA excedido. Por favor, aguarde um minuto e tente novamente." };
    }
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

export async function generateAppraisalSamples(
  propertyAddress: string, 
  propertyArea: number, 
  propertyBuiltArea: number, 
  propertyAge: number, 
  propertyConservation: string
) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "API Key ausente." };
  }

  const prompt = `Você é um perito avaliador de imóveis experiente, seguindo a NBR-14653. 
    O imóvel avaliando está localizado em: ${propertyAddress}.
    Área do terreno: ${propertyArea}m².
    Área construída: ${propertyBuiltArea}m².
    Idade do imóvel: ${propertyAge} anos.
    Estado de conservação: ${propertyConservation}.

    Sua tarefa:
    1. Simule a busca de 10 imóveis semelhantes (amostras) reais ou altamente realistas que estejam à venda ou foram vendidos recentemente na mesma região/bairro de ${propertyAddress}.
    2. Para cada amostra, forneça dados precisos de mercado e um link (URL) fictício ou real de onde a amostra foi obtida (ex: ZAP Imóveis, VivaReal, etc) para fins de auditoria.
    3. Calcule os fatores de homogeneização para cada amostra em relação ao imóvel avaliando:
       - Fator Oferta (FO): Ajuste de negociação (ex: 0.90).
       - Fator Localização (FL): Diferença de valorização da vizinhança.
       - Fator Área (FA): Diferença de tamanho.
       - Fator Padrão (FP): Padrão construtivo e conservação.
       - Fator Idade (FId): Depreciação física.
       - Fator Frente/Topografia (FT): Diferença de testada ou relevo.
    4. Calcule o Valor Unitário Homogeneizado (Vu) para cada amostra:
       Vu = (ValorOferta * FO * FL * FA * FP * FId * FT) / ÁreaConstruída.
    
    Retorne EXATAMENTE 10 amostras em JSON estrito.`;

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            samples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  area: { type: Type.NUMBER },
                  builtArea: { type: Type.NUMBER },
                  offerPrice: { type: Type.NUMBER },
                  sourceUrl: { type: Type.STRING, description: "URL da fonte da amostra para auditoria" },
                  factors: {
                    type: Type.OBJECT,
                    properties: {
                      offer: { type: Type.NUMBER },
                      location: { type: Type.NUMBER },
                      area: { type: Type.NUMBER },
                      standard: { type: Type.NUMBER },
                      age: { type: Type.NUMBER },
                      frontage: { type: Type.NUMBER }
                    }
                  },
                  unitValue: { type: Type.NUMBER },
                  homogenizedValue: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["samples"]
        }
      }
    }));

    if (!response.text) return { error: "Resposta vazia da IA." };
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Appraisal Error:", error);
    return { error: error?.message || "Erro na geração de amostras." };
  }
}

export async function analyzeAppraisalMedia(base64Data: string, mimeType: string, propertyDetails: string, samplesSummary: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return "Erro: API Key ausente.";

  const prompt = `Analise esta mídia (foto/vídeo) do imóvel que está sendo avaliado.
    Dados do Imóvel: ${propertyDetails}
    Resumo das Amostras de Mercado: ${samplesSummary}
    
    Sua tarefa:
    1. Descreva o estado de conservação visível nesta mídia.
    2. Compare tecnicamente o padrão construtivo e conservação deste imóvel com o padrão das amostras citadas.
    3. Conclua se o imóvel está acima, na média ou abaixo do padrão de mercado da região.
    4. Forneça uma justificativa técnica para o Fator Padrão (FP) e Fator Idade (FId) aplicados.
    
    Retorne um texto técnico e objetivo em português.`;

  try {
    console.log(`[Gemini] Analisando mídia do parecer (${mimeType})...`);
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      }
    }));

    if (!response || !response.text) {
      console.error("[Gemini] Resposta vazia ou bloqueada pela IA.");
      return "A IA não conseguiu gerar uma análise para esta mídia. Pode ter sido bloqueada por filtros de segurança ou a imagem não está clara o suficiente.";
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Appraisal Media Analysis Error:", error);
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      return "Erro: Limite de uso da IA excedido. Tente novamente em alguns instantes.";
    }
    return `Erro na análise da mídia: ${errorMsg}`;
  }
}
