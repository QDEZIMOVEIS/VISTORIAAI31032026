import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for JSON bodies up to 100mb (essential for base64 image/video payloads)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper to get GoogleGenAI instance server-side
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in server environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Retry utility with exponential backoff for 429 quota errors
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error?.message || error || '');
      const isQuotaError =
        errorStr.includes('429') ||
        errorStr.includes('RESOURCE_EXHAUSTED') ||
        errorStr.toLowerCase().includes('quota') ||
        errorStr.toLowerCase().includes('limit') ||
        errorStr.toLowerCase().includes('limite');

      if (isQuotaError && i < retries - 1) {
        const jitter = Math.random() * 1000;
        const currentDelay = delay * Math.pow(2, i) + jitter;
        console.warn(`[Gemini Server] Limite de cota (429). Retentativa ${i + 1}/${retries} em ${Math.round(currentDelay)}ms...`);
        await new Promise((res) => setTimeout(res, currentDelay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Falha após múltiplas tentativas com a API Gemini.');
}

// 1. Endpoint: Analyze single room media (photo or video walkthrough)
app.post('/api/gemini/analyze-room-media', async (req, res) => {
  try {
    const { base64Data, mimeType, userNotes, inspectionType } = req.body;
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'base64Data and mimeType are required.' });
    }

    const ai = getGenAI();
    const isVideo = mimeType.startsWith('video/');
    const isEntry = inspectionType === 'entrada';

    const prompt = `Você é um vistoriador de imóveis profissional extremamente experiente e detalhista. 
Mídia para análise: um(a) ${isVideo ? 'vídeo walkthrough' : 'foto'} tirada de um ambiente de imóvel.
${userNotes ? `Importante: Considere estas observações inseridas pelo vistoriador em campo: "${userNotes}"` : ''}

Sua principal missão é RETRATAR DE FORMA ABSOLUTAMENTE FIEL E REALISTA O ATUAL ESTADO DE CONSERVAÇÃO DO IMÓVEL com base no que é mostrado.
No caso de vídeo, analise atentamente toda a mídia (as imagens e a pista de áudio com a voz de narração do vistoriador se houver).

Identifique o ambiente (ex: Sala, Cozinha, Banheiro, Dormitório 1, Varanda).
Descreva o ambiente de forma técnica, objetiva e minuciosa (ex: "Paredes com pintura látex branca apresentando pequenos riscos, piso cerâmico 60x60 em bom estado, teto com moldura de gesso").

DIRETRIZES ESPECÍFICAS CONFORME O TIPO DE VISTORIA:
${isEntry ? `ATENÇÃO: ESTA É UMA VISTORIA DE ENTRADA.
O Locatário está apenas recebendo o imóvel neste momento e NÃO teve oportunidade de causar nenhum dano.
Portanto, siga RIGOROSAMENTE estas diretrizes especiais de entrada:
1. OMITA COMPLETAMENTE quaisquer problemas de manutenção comum ou danos decorrentes de uso que seriam de responsabilidade do Locatário (como furos na parede, riscos de móveis, sujeira superficial na pintura, rabiscos, manchas de uso, etc.). NÃO detecte, não aponte e NÃO inclua esses itens de manutenção no laudo ou no orçamento!
2. APONTE APENAS problemas estruturais, vazamentos e defeitos (vícios) do imóvel que são de responsabilidade direta do LOCADOR (como infiltrações nas paredes/teto, mofos de origem hidráulica ou estrutural, rachaduras/fissuras estruturais na alvenaria, fiação elétrica exposta com risco, portas/janelas desalinhadas ou emperradas por defeito estrutural, problemas crônicos de tubulação).
3. Para todos esses defeitos estruturais do imóvel, atribua obrigatoriamente a responsabilidade como "Locador" (NÃO use "Locatário" nem "N/A").` : `ESTA É UMA VISTORIA DE SAÍDA OU GERAL.
Siga as regras normais de atribuição de responsabilidade:
1. REGRAS DE PINTURA (DANOS DO LOCATÁRIO vs ESTRUTURAIS):
   - Se identificar furos, sujeiras, riscos, manchas, marcas de móveis na pintura (que por lei são de responsabilidade do Locatário):
     * Sempre orçar a pintura de TODO o ambiente/cômodo por completo (todas as paredes).
     * Nunca orçar retoques isolados. Sempre usar valores de pintura integral com tintas de paletas padrões e com qualidade/padrão "standard".
   - Se houver sujidade ou furos na pintura (danos do Locatário) mas você TAMBÉM constatar problemas estruturais (responsabilidade do Locador, como infiltração ou vazamento):
     * Mesmo assim, você deve orçar a pintura de todo o ambiente (todas as paredes como responsabilidade do locatário) e APENAS mencionar/descrever os reparos estruturais como observação, sem colocar custo financeiro para eles.
   - Reparos estruturais que são de responsabilidade do LOCADOR (Ex: infiltrações, fissuras na estrutura, mofos decorrentes de problemas na tubulação) NUNCA devem ter custos orçados (materialCost = 0, laborCost = 0, totalCost = 0). Devem ser apenas descritos textualmente de forma informativa.
2. Responsabilidade e Interpretação do Áudio:
   - Use "Locador" (desgaste natural ou estrutural) ou "Locatário" (mau uso, dano ou falta de manutenção).
   - CRÍTICO: Se a narração no áudio/vídeo indicar a autoria, causa ou quem deve arcar com o reparo, use estritamente essa interpretação da gravação de áudio para classificar a responsabilidade correta.`}

Classifique o estado de conservação atual geral em: Novo, Bom, Regular, Ruim ou Impróprio para uso baseado 100% no estado real observado.
O orçamento DEVE ser baseado na tabela de vigência SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP. Prevaleça SEMPRE o menor valor entre a Tabela SINAPI e os preços da Região. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA. Apresente a FONTE do valor.

${isVideo ? `7. TRANSCRIÇÃO DE ÁUDIO E INTERPRETAÇÃO:
   - Ouça atentamente o som/gravação de áudio do vídeo.
   - Se houver alguém falando ou narrando observações, faça uma transcrição textual literal completa de tudo o que foi falado e insira-a no campo "audioTranscription". Se não houver voz, retorne string vazia ("").` : '8. Como a mídia é uma foto, o campo "audioTranscription" deve ser retornado como string vazia ("").'}

Retorne a análise em formato JSON estrito adequado ao schema.`;

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roomType: { type: Type.STRING, description: 'Tipo do ambiente' },
              technicalDescription: { type: Type.STRING, description: 'Descrição técnica completa do estado de conservação atual' },
              detectedIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    responsibility: { type: Type.STRING, enum: ['Locador', 'Locatário', 'N/A'] },
                    materialCost: { type: Type.NUMBER, description: 'Custo de material (SINAPI/SP ou Ribeirão Preto)' },
                    laborCost: { type: Type.NUMBER, description: 'Custo de mão de obra (SINAPI/SP ou Ribeirão Preto)' },
                    totalCost: { type: Type.NUMBER, description: 'Custo total (Material + Mão de Obra)' },
                    source: { type: Type.STRING, description: 'Fonte do valor (ex: SINAPI/SP, Loja X)' },
                  },
                },
              },
              conservationState: { type: Type.STRING, enum: ['Novo', 'Bom', 'Regular', 'Ruim', 'Impróprio para uso'] },
              audioTranscription: { type: Type.STRING, description: 'Transcrição literal e fiel de qualquer narração por voz no áudio do vídeo.' },
            },
            required: ['roomType', 'technicalDescription', 'conservationState', 'audioTranscription'],
          },
        },
      })
    );

    if (!response.text) {
      return res.status(500).json({ error: 'Resposta vazia retornada pela IA.' });
    }

    const parsed = JSON.parse(response.text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Server error in /api/gemini/analyze-room-media:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao processar análise de mídia.' });
  }
});

// 2. Endpoint: Analyze multiple room media items consolidated
app.post('/api/gemini/analyze-room-media-multiple', async (req, res) => {
  try {
    const { mediaList, userNotes, inspectionType } = req.body;
    if (!mediaList || !Array.isArray(mediaList) || mediaList.length === 0) {
      return res.status(400).json({ error: 'mediaList array is required.' });
    }

    const ai = getGenAI();
    const isEntry = inspectionType === 'entrada';

    const prompt = `Você é um vistoriador de imóveis profissional extremamente experiente e detalhista. 
Mídias para análise: um conjunto de ${mediaList.length} fotos/vídeos tirados de um ambiente de imóvel para análise unificada.
${userNotes ? `Importante: Considere estas observações inseridas pelo vistoriador em campo: "${userNotes}"` : ''}

Sua principal missão é analisar todas as mídias em conjunto e RETRATAR DE FORMA ABSOLUTAMENTE FIEL, REALISTA E CONSOLIDADA O ATUAL ESTADO DE CONSERVAÇÃO DO AMBIENTE, evitando redundância de itens repetidos.

Identifique o ambiente e gere uma descrição técnica única e objetiva.
Descreva o ambiente de forma técnica, objetiva e minuciosa.

DIRETRIZES CONFORME O TIPO DE VISTORIA:
${isEntry ? `ATENÇÃO: ESTA É UMA VISTORIA DE ENTRADA.
1. OMITA COMPLETAMENTE quaisquer problemas de manutenção comum do Locatário (furos, riscos superficiais, etc.).
2. APONTE APENAS problemas estruturais, vazamentos e defeitos do imóvel de responsabilidade do LOCADOR.
3. Para todos esses defeitos estruturais do imóvel, atribua a responsabilidade como "Locador".` : `ESTA É UMA VISTORIA DE SAÍDA OU GERAL.
1. REGRAS DE PINTURA: Se identificar danos na pintura causados pelo inquilino, orçar a pintura de TODO o ambiente/cômodo por completo com tintas de qualidade standard. Nunca orçar retoques isolados.
2. Reparos estruturais de responsabilidade do Locador não devem ter custos financeiros orçados.`}

Classifique o estado de conservação atual geral em: Novo, Bom, Regular, Ruim ou Impróprio para uso.
O orçamento DEVE ser baseado na tabela SINAPI/SP e nos preços praticados na Região de Ribeirão Preto/SP.

Retorne a análise em formato JSON estrito adequado ao schema fornecido.`;

    const parts: any[] = mediaList.map((m: any) => ({
      inlineData: {
        data: m.data,
        mimeType: m.mimeType,
      },
    }));
    parts.push({ text: prompt });

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roomType: { type: Type.STRING, description: 'Tipo do ambiente' },
              technicalDescription: { type: Type.STRING, description: 'Descrição técnica completa do estado de conservação atual unificado' },
              detectedIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    responsibility: { type: Type.STRING, enum: ['Locador', 'Locatário', 'N/A'] },
                    materialCost: { type: Type.NUMBER, description: 'Custo de material' },
                    laborCost: { type: Type.NUMBER, description: 'Custo de mão de obra' },
                    totalCost: { type: Type.NUMBER, description: 'Custo total' },
                    source: { type: Type.STRING, description: 'Fonte do valor' },
                  },
                },
              },
              conservationState: { type: Type.STRING, enum: ['Novo', 'Bom', 'Regular', 'Ruim', 'Impróprio para uso'] },
              audioTranscription: { type: Type.STRING, description: 'Transcrição literal consolidada de qualquer áudio nos vídeos.' },
            },
            required: ['roomType', 'technicalDescription', 'conservationState', 'audioTranscription'],
          },
        },
      })
    );

    if (!response.text) {
      return res.status(500).json({ error: 'Resposta vazia retornada pela IA.' });
    }

    const parsed = JSON.parse(response.text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Server error in /api/gemini/analyze-room-media-multiple:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao processar análise unificada de mídia.' });
  }
});

// 3. Endpoint: Transcribe Audio
app.post('/api/gemini/transcribe-audio', async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: 'base64Audio and mimeType are required.' });
    }

    const ai = getGenAI();
    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: mimeType,
              },
            },
            {
              text: 'Transcreva este áudio de observações de vistoria imobiliária para texto com pontuação adequada em português.',
            },
          ],
        },
      })
    );

    return res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Server error in /api/gemini/transcribe-audio:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao transcrever áudio.' });
  }
});

// 4. Endpoint: Generate Appraisal Samples (NBR-14653)
app.post('/api/gemini/generate-appraisal-samples', async (req, res) => {
  try {
    const { propertyAddress, propertyArea, propertyBuiltArea, propertyAge, propertyConservation, propertyCep, propertyNumber } = req.body;

    const ai = getGenAI();
    const isTerrainOnly = !propertyBuiltArea || propertyBuiltArea === 0;

    const prompt = `Você é um perito avaliador de imóveis experiente, seguindo a NBR-14653. 
O imóvel avaliando está localizado em: ${propertyAddress}${propertyNumber ? `, nº ${propertyNumber}` : ''}${propertyCep ? `, CEP: ${propertyCep}` : ''}.
${isTerrainOnly ? `ATENÇÃO: Este é um TERRENO SEM CONSTRUÇÃO (Lote Vazio). A avaliação deve ser baseada puramente no valor do terreno (m² de terreno).` : ''}
Área do terreno: ${propertyArea}m².
${isTerrainOnly ? '' : `Área construída: ${propertyBuiltArea}m².\nIdade do imóvel: ${propertyAge} anos.\nEstado de conservação: ${propertyConservation}.`}

Sua tarefa:
1. Busque e retorne entre 7 e 10 imóveis semelhantes (amostras) reais ou extremamente realistas que estejam à venda ou foram vendidos recentemente na REGIÃO/CIDADE LOCAL EXATA DO IMÓVEL AVALIANDO (${propertyAddress}).
   - REQUISITO CRÍTICO DE GEOLOCALIZAÇÃO: Se a cidade for Jaboticabal - SP, você deve OBRIGATORIAMENTE escolher apenas bairros reais desta lista exata: [Centro, Nova Jaboticabal, Jardim Paulista, Jardim Primavera, Jardim Santa Rita, Jardim das Rosas, Jardim Alvorada, Jardim Sorocabano, Jardim Tangará, Aparecida, Vila Nova, Vila Industrial, Jardim San Marco, Jardim Terras de São Bento, Jardim Barra Grande, Parque das Nações, Jardim Europa, Jardim São Marcos, Jardim Amélia, Recreio dos Bandeirantes, Jardim Paraíso, Jardim São Bernardo, Jardim Glória, Jardim Grajaú, Jardim Morumbi, Jardim Recanto das Flores, Jardim Eldorado, Jardim Clodoaldo, Jardim Santo Antônio, Jardim Sampaio, Cohab].
2. Calcule os fatores de homogeneização para cada amostra em relação ao imóvel avaliando segundo a NBR-14653.
   - Fator Oferta (FO): padrão 0,85 para anúncios.
   - Fator Localização (FL), Fator Área (FA), Fator Padrão (FP), Fator Idade (FId), Fator Frente/Topografia (FT).
3. Calcule o Valor Unitário Homogeneizado (Vu):
   Vu = (ValorOferta * FO * FL * FA * ${isTerrainOnly ? 'FT' : 'FP * FId * FT'}) / ${isTerrainOnly ? 'Área do Terreno' : 'Área Construída'}.

Retorne entre 7 e 10 amostras em formato JSON estrito conforme o schema.`;

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
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
                    sourceUrl: { type: Type.STRING, description: 'URL da fonte da amostra para auditoria' },
                    factors: {
                      type: Type.OBJECT,
                      properties: {
                        offer: { type: Type.NUMBER },
                        location: { type: Type.NUMBER },
                        area: { type: Type.NUMBER },
                        standard: { type: Type.NUMBER },
                        age: { type: Type.NUMBER },
                        frontage: { type: Type.NUMBER },
                      },
                    },
                    unitValue: { type: Type.NUMBER },
                    homogenizedValue: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ['samples'],
          },
        },
      })
    );

    if (!response.text) return res.status(500).json({ error: 'Resposta vazia da IA.' });
    let cleanedText = response.text.trim();
    if (cleanedText.includes('```json')) {
      cleanedText = cleanedText.split('```json')[1].split('```')[0].trim();
    } else if (cleanedText.includes('```')) {
      cleanedText = cleanedText.split('```')[1].split('```')[0].trim();
    }
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error('Server error in /api/gemini/generate-appraisal-samples:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao gerar amostras de parecer.' });
  }
});

// 5. Endpoint: Analyze Appraisal Media
app.post('/api/gemini/analyze-appraisal-media', async (req, res) => {
  try {
    const { mediaList, propertyDetails, samplesSummary } = req.body;
    if (!mediaList || !Array.isArray(mediaList)) {
      return res.status(400).json({ error: 'mediaList is required.' });
    }

    const ai = getGenAI();
    const prompt = `Analise as mídias (fotos/vídeos) do imóvel que está sendo avaliado para fazer um parecer consolidado do estado de conservação.
Dados do Imóvel: ${propertyDetails}
Resumo das Amostras de Mercado: ${samplesSummary}

Sua tarefa:
1. Descreva de forma detalhada o estado de conservação visível no conjunto de todas as mídias fornecidas.
2. Compare tecnicamente o padrão construtivo e conservação deste imóvel com o padrão das amostras citadas.
3. Conclua de forma técnica se o imóvel está acima, na média ou abaixo do padrão de mercado da região.
4. Forneça uma justificativa técnica clara para o Fator Padrão (FP) e Fator Idade (FId) aplicados.

Retorne um texto técnico e objetivo em português.`;

    const parts: any[] = mediaList.map((m: any) => ({
      inlineData: {
        data: m.data,
        mimeType: m.mimeType,
      },
    }));
    parts.push({ text: prompt });

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
      })
    );

    return res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Server error in /api/gemini/analyze-appraisal-media:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao analisar mídia do parecer.' });
  }
});

// 6. Endpoint: Generate QDEZ Marketing Diagnosis
app.post('/api/gemini/generate-qdez-marketing-diagnosis', async (req, res) => {
  try {
    const {
      propertyAddress,
      propertyArea,
      propertyBuiltArea,
      propertyAge,
      propertyConservation,
      propertyDescription,
      evaluatedValue,
    } = req.body;

    const ai = getGenAI();
    const prompt = `Você é um Consultor Imobiliário de Alta Performance e Diretor de Captação Exclusiva na QDEZ IMÓVEIS.
Seu objetivo é analisar os dados do imóvel abaixo e gerar relatórios estratégicos para captação exclusiva seguindo a CARTILHA QDEZ:

DADOS DO IMÓVEL:
- Endereço: ${propertyAddress}
- Área de Terreno: ${propertyArea}m²
- Área Construída: ${propertyBuiltArea}m²
- Idade do Imóvel: ${propertyAge} anos
- Estado de Conservação: ${propertyConservation}
- Descrição: ${propertyDescription}
- Valor Avaliado de Mercado: R$ ${Number(evaluatedValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

GERAR Parecer Técnico de Comercialização e Diagnóstico Rápido de Campo conforme o schema JSON estrito.`;

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              technicalMarketingReport: { type: Type.STRING },
              quickFieldDiagnosis: {
                type: Type.OBJECT,
                properties: {
                  occupancyType: { type: Type.STRING },
                  valuationItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  attentionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendedExclusivityStrategy: { type: Type.STRING },
                  marketingLaunchChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['occupancyType', 'valuationItems', 'attentionPoints', 'recommendedExclusivityStrategy', 'marketingLaunchChannels'],
              },
            },
            required: ['technicalMarketingReport', 'quickFieldDiagnosis'],
          },
        },
      })
    );

    if (!response.text) return res.status(500).json({ error: 'Sem resposta da IA.' });
    let cleanedText = response.text.trim();
    if (cleanedText.includes('```json')) {
      cleanedText = cleanedText.split('```json')[1].split('```')[0].trim();
    } else if (cleanedText.includes('```')) {
      cleanedText = cleanedText.split('```')[1].split('```')[0].trim();
    }
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error('Server error in /api/gemini/generate-qdez-marketing-diagnosis:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao gerar parecer QDEZ.' });
  }
});

// 7. Endpoint: Generate Replacement Samples
app.post('/api/gemini/generate-replacement-samples', async (req, res) => {
  try {
    const {
      propertyAddress,
      propertyArea,
      propertyBuiltArea,
      propertyAge,
      propertyConservation,
      existingSamplesSummary,
      countToGenerate,
      propertyCep,
      propertyNumber,
    } = req.body;

    const ai = getGenAI();
    const isTerrainOnly = !propertyBuiltArea || propertyBuiltArea === 0;

    const prompt = `Você é um perito avaliador de imóveis experiente, seguindo a NBR-14653.
O imóvel avaliando está localizado em: ${propertyAddress}${propertyNumber ? `, nº ${propertyNumber}` : ''}${propertyCep ? `, CEP: ${propertyCep}` : ''}.
${isTerrainOnly ? `ATENÇÃO: Este é um TERRENO SEM CONSTRUÇÃO.` : ''}
Área do terreno: ${propertyArea}m².
${isTerrainOnly ? '' : `Área construída: ${propertyBuiltArea}m².\nIdade do imóvel: ${propertyAge} anos.\nEstado de conservação: ${propertyConservation}.`}

Já possuímos as seguintes amostras que NÃO devem ser duplicadas:
${existingSamplesSummary}

Gere exatamente ${countToGenerate || 1} novas amostras reais e compatíveis no município do imóvel avaliando com fatores de homogeneização calculados.`;

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
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
                    sourceUrl: { type: Type.STRING },
                    factors: {
                      type: Type.OBJECT,
                      properties: {
                        offer: { type: Type.NUMBER },
                        location: { type: Type.NUMBER },
                        area: { type: Type.NUMBER },
                        standard: { type: Type.NUMBER },
                        age: { type: Type.NUMBER },
                        frontage: { type: Type.NUMBER },
                      },
                    },
                    unitValue: { type: Type.NUMBER },
                    homogenizedValue: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ['samples'],
          },
        },
      })
    );

    if (!response.text) return res.status(500).json({ error: 'Resposta vazia da IA.' });
    let cleanedText = response.text.trim();
    if (cleanedText.includes('```json')) {
      cleanedText = cleanedText.split('```json')[1].split('```')[0].trim();
    } else if (cleanedText.includes('```')) {
      cleanedText = cleanedText.split('```')[1].split('```')[0].trim();
    }
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error('Server error in /api/gemini/generate-replacement-samples:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao gerar amostras de reposição.' });
  }
});

// 8. Endpoint: PDF Comparison
app.post('/api/gemini/compare-pdfs', async (req, res) => {
  try {
    const { text1, text2 } = req.body;
    if (!text1 || !text2) {
      return res.status(400).json({ error: 'text1 and text2 are required.' });
    }

    const ai = getGenAI();
    const prompt = `Você é um engenheiro perito e vistoriador de imóveis sênior com vasta experiência em perícias imobiliárias.
Compare minunciosamente o Laudo de Entrada (Vistoria Inicial) e o Laudo de Saída (Vistoria Final):

LAUDO DE ENTRADA:
${text1}

LAUDO DE SAÍDA:
${text2}

Identifique todas as divergências, danos e avarias ocorridas durante a locação de acordo com as regras imobiliárias e a lei do inquilinato.
Retorne um JSON estrito com summary, rooms (com issues, responsabilidade Locador/Locatário, materialCost, laborCost, totalCost) e totalEstimatedCost.`;

    const response = await fetchWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })
    );

    if (!response.text) {
      return res.status(500).json({ error: 'Resposta vazia da inteligência artificial.' });
    }
    return res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('Server error in /api/gemini/compare-pdfs:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao comparar laudos em PDF.' });
  }
});

// Vite middleware integration for full-stack dev server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack Server] App running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('[Full-Stack Server] Error starting server:', err);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
}

startServer().catch((err) => {
  console.error('[Full-Stack Server] Fatal error in startServer:', err);
});
