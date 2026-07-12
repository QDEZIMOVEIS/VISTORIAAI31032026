import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function fetchWithRetry(fn: () => Promise<any>, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error?.message || error || "");
      const isQuotaError = 
        errorStr.includes('429') || 
        errorStr.includes('RESOURCE_EXHAUSTED') ||
        errorStr.toLowerCase().includes('quota') ||
        errorStr.toLowerCase().includes('limit') ||
        errorStr.toLowerCase().includes('limite');

      if (isQuotaError && i < retries - 1) {
        // Calculate delay with exponential backoff and random jitter (between 0 and 1000ms)
        const jitter = Math.random() * 1000;
        const currentDelay = delay * Math.pow(2, i) + jitter;
        console.warn(`[Gemini] Limite de cota excedido (429/Resource Exhausted). Tentando novamente em ${Math.round(currentDelay)}ms... (Tentativa ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
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
    
    const prompt = `Você é um vistoriador de imóveis profissional extremamente experiente e detalhista. 
            Mídia para análise: um(a) ${isVideo ? 'vídeo walkthrough' : 'foto'} tirada de um ambiente de imóvel.
            ${userNotes ? `Importante: Considere estas observações inseridas pelo vistoriador em campo: "${userNotes}"` : ''}
            
            Sua principal missão é RETRATAR DE FORMA ABSOLUTAMENTE FIEL E REALISTA O ATUAL ESTADO DE CONSERVAÇÃO DO IMÓVEL com base no que é mostrado.
            No caso de vídeo, analise atentamente toda a mídium (as imagens e a pista de áudio com a voz de narração do vistoriador se houver).
            
            Identifique o ambiente (ex: Sala, Cozinha, Banheiro, Dormitório 1, Coberta).
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
               - CRÍTICO: Se a narração no áudio/vídeo indicar a autoria, causa ou quem deve arcar com o reparo (ex: o vistoriador diz "esta mancha foi o inquilino quem derramou tinta", "esse trinco foi quebrado pelo locatário", ou "esse mofo se origina de vazamento interno na coluna do prédio, de responsabilidade do locador"), use estritamente essa interpretação da gravação de áudio para apurar, definir e classificar a responsabilidade correta como "Locatário" ou "Locador". O áudio gravado em campo é a fonte prioritária e imperativa de decisão técnica.`}

            Classifique o estado de conservação atual geral em: Novo, Bom, Regular, Ruim ou Impróprio para uso baseado 100% no estado real observado.
            
            O orçamento DEVE ser baseado na tabela vigência SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP. Prevaleça SEMPRE o menor valor entre a Tabela SINAPI e os preços da Região. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA. Apresente a FONTE do valor.
            
            ${isVideo ? `7. TRANSCRIÇÃO DE ÁUDIO E INTERPRETAÇÃO (REQUISITO FUNDAMENTAL):
               - Ouça atentamente o som/gravação de áudio do vídeo.
               - Se houver alguém falando ou narrando observações (como o vistoriador descrevendo defeitos de forma gravada ou verbal), faça uma transcrição textual literal completa de tudo o que foi falado e insira-a no campo "audioTranscription".
               - Interprete as declarações faladas para orientar e apurar soberanamente de quem é cada responsabilidade (ex: Locatário vs Locador) no campo "detectedIssues". Se não houver voz ou se o vídeo for silencioso, retorne string vazia ("").` : '8. Como a mídia é uma foto, o campo "audioTranscription" deve obrigatoriamente ser retornado como uma string vazia ("").'}

            Retorne a análise em formato JSON estrito adequado ao schema fornecido.`;

    console.log(`[Gemini] Iniciando análise multimodal (${mimeType})...`);
    
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash", 
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
            technicalDescription: { type: Type.STRING, description: "Descrição técnica completa do estado de conservação atual" },
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
            conservationState: { type: Type.STRING, enum: ["Novo", "Bom", "Regular", "Ruim", "Impróprio para uso"] },
            audioTranscription: { type: Type.STRING, description: "Transcrição literal e fiel de qualquer narração por voz no áudio do vídeo. Retorne string vazia se não for um vídeo ou se não houver fala." }
          },
          required: ["roomType", "technicalDescription", "conservationState", "audioTranscription"]
        }
      }
    }));

    if (!response.text) {
      console.error("[Gemini] Resposta vazia da IA.");
      return { error: "A IA retornou uma resposta vazia. Pode ser um filtro de segurança ou erro temporário." };
    }

    console.log("[Gemini] Resposta recebida com sucesso.");
    if (response.text.trim().startsWith("<!doctype") || response.text.trim().startsWith("<html")) {
      return { error: "A API de Inteligência Artificial retornou uma resposta inválida em formato HTML. Verifique sua chave de acesso (API Key) nas configurações do AI Studio." };
    }
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorStr = String(error?.message || error || "");
    const isForbidden = errorStr.includes('403') || 
                        errorStr.toLowerCase().includes('forbidden') || 
                        errorStr.toLowerCase().includes('permission_denied') || 
                        errorStr.toLowerCase().includes('proibido') || 
                        errorStr.toLowerCase().includes('api_key') ||
                        errorStr.toLowerCase().includes('api key') ||
                        errorStr.toLowerCase().includes('unauthorized');
                        
    if (isForbidden) {
      return { 
        error: "Acesso Negado (403/Proibido). A sua chave GEMINI_API_KEY no painel de Configurações (Settings > Secrets) do AI Studio está inválida, incorreta, ausente ou sem permissão para este modelo. Como resolver: cadastre uma GEMINI_API_KEY válida nas configurações do AI Studio." 
      };
    }
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return { error: "Limite de uso da IA excedido. Por favor, aguarde um minuto e tente novamente." };
    }
    return { error: error?.message || "Erro desconhecido na análise da IA." };
  }
}

export async function analyzeRoomMediaMultiple(
  mediaList: { data: string; mimeType: string }[],
  userNotes?: string,
  inspectionType?: string
) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in environment variables.");
    return { error: "API Key ausente. Verifique as configurações no Google Cloud Console / AI Studio." };
  }

  try {
    const isEntry = inspectionType === 'entrada';
    
    const prompt = `Você é um vistoriador de imóveis profissional extremamente experiente e detalhista. 
            Mídias para análise: um conjunto de ${mediaList.length} fotos/vídeos tirados de um ambiente de imóvel para análise unificada.
            ${userNotes ? `Importante: Considere estas observações inseridas pelo vistoriador em campo: "${userNotes}"` : ''}
            
            Sua principal missão é analisar todas as mídias em conjunto e RETRATAR DE FORMA ABSOLUTAMENTE FIEL, REALISTA E DE MANEIRA ÚNICA/CONSOLIDADA O ATUAL ESTADO DE CONSERVAÇÃO DO AMBIENTE, evitando qualquer tipo de redundância de itens repetidos.
            
            Identifique o ambiente e gere uma descrição técnica única e objetiva.
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
               - CRÍTICO: Se a narração no áudio/vídeo indicar a autoria, causa ou quem deve arcar com o reparo (ex: o vistoriador diz "esta mancha foi o inquilino quem derramou tinta", "esse trinco foi quebrado pelo locatário", ou "esse mofo se origina de vazamento interno na coluna do prédio, de responsabilidade do locador"), use estritamente essa interpretação da gravação de áudio para apurar, definir e classificar a responsabilidade correta como "Locatário" ou "Locador". O áudio gravado em campo é a fonte prioritária e imperativa de decisão técnica.`}

            Classifique o estado de conservação atual geral em: Novo, Bom, Regular, Ruim ou Impróprio para uso baseado 100% no estado real observado nas mídias fornecidas.
            
            O orçamento DEVE ser baseado na tabela vigência SINAPI/SP e nos valores de mercado da região de Ribeirão Preto, SP. Prevaleça SEMPRE o menor valor entre a Tabela SINAPI e os preços da Região. Separe obrigatoriamente o valor de MATERIAL e MÃO DE OBRA. Apresente a FONTE do valor. Como você está fazendo uma única análise unificada para o ambiente inteiro, consolide os itens de reparo para evitar redundâncias. Por exemplo, se houver duas fotos mostrando danos na pintura, retorne apenas UM item de reparo de pintura para todo o ambiente.
            
            Retorne a análise em formato JSON estrito adequado ao schema fornecido.`;

    console.log(`[Gemini] Iniciando análise unificada de ${mediaList.length} mídias...`);
    
    const parts: any[] = mediaList.map(media => ({
      inlineData: {
        data: media.data,
        mimeType: media.mimeType,
      }
    }));
    parts.push({ text: prompt });

    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomType: { type: Type.STRING, description: "Tipo do ambiente" },
            technicalDescription: { type: Type.STRING, description: "Descrição técnica completa do estado de conservação atual unificado de todo o ambiente" },
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
            conservationState: { type: Type.STRING, enum: ["Novo", "Bom", "Regular", "Ruim", "Impróprio para uso"] },
            audioTranscription: { type: Type.STRING, description: "Transcrição literal consolidada de qualquer narração em áudio se presente nos vídeos. Retorne string vazia se não houver fala." }
          },
          required: ["roomType", "technicalDescription", "conservationState", "audioTranscription"]
        }
      }
    }));

    if (!response.text) {
      console.error("[Gemini] Resposta vazia da IA.");
      return { error: "A IA retornou uma resposta vazia. Pode ser um filtro de segurança ou erro temporário." };
    }

    console.log("[Gemini] Resposta recebida com sucesso.");
    if (response.text.trim().startsWith("<!doctype") || response.text.trim().startsWith("<html")) {
      return { error: "A API de Inteligência Artificial retornou uma resposta inválida em formato HTML. Verifique sua chave de acesso (API Key) nas configurações do AI Studio." };
    }
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Analysis Error (Multiple):", error);
    return { error: error?.message || "Erro desconhecido na análise de IA." };
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    }));
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
  propertyConservation: string,
  propertyCep?: string,
  propertyNumber?: string
) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "API Key ausente." };
  }

  const isTerrainOnly = !propertyBuiltArea || propertyBuiltArea === 0;

  const prompt = `Você é um perito avaliador de imóveis experiente, seguindo a NBR-14653. 
    O imóvel avaliando está localizado em: ${propertyAddress}${propertyNumber ? `, nº ${propertyNumber}` : ''}${propertyCep ? `, CEP: ${propertyCep}` : ''}.
    ${isTerrainOnly ? `ATENÇÃO: Este é um TERRENO SEM CONSTRUÇÃO (Lote Vazio). A avaliação deve ser baseada puramente no valor do terreno (m² de terreno).` : ''}
    Área do terreno: ${propertyArea}m².
    ${isTerrainOnly ? '' : `Área construída: ${propertyBuiltArea}m².`}
    ${isTerrainOnly ? '' : `Idade do imóvel: ${propertyAge} anos.`}
    ${isTerrainOnly ? '' : `Estado de conservação: ${propertyConservation}.`}

    Sua tarefa:
    1. Simule a busca de 10 imóveis semelhantes (amostras) reais ou altamente realistas que estejam à venda ou foram vendidos recentemente na REGIÃO/CIDADE LOCAL EXATA DO IMÓVEL AVALIANDO (${propertyAddress}).
       - REQUISITO DE FONTES LOCAIS: Além das plataformas de vendas de imóveis tradicionais (ZAP Imóveis, VivaReal, OLX), você DEVE utilizar anúncios de sites de imobiliárias localizadas na cidade de Jaboticabal/SP. Para as amostras, utilize como referência e fonte os seguintes sites de imobiliárias locais atuantes em Jaboticabal/SP (em conjunto com as tradicionais):
         * www.sanmarinonegocios.com.br
         * https://nosrallaimoveis.com.br
         * https://www.miquilinpontes.com.br
         * https://moradaimvjab.com.br
         * https://vidanovaimobiliaria.com.br
         * https://ayresimoveisjaboticabal.com.br
         * https://www2.imobiliariarealiza.com
         * https://www.elevaempreendimentos.com.br
         * https://www.regionalimobiliaria.com.br/
         * https://sampaioimoveisjb.com.br/
         * https://www.jdiasconsultoria.imb.br/
         * https://www.imobiliariahenru.com.br/
         * https://ummarconasuavida.com/
         * https://www.qdez.com.br/
         * https://achouinegociosimobiliarios.com.br/
         * https://www.grupodecallimoveis.com.br/
         * https://www.venire.com.br/
         * https://goldbusiness.com.br/
         * https://www.nilcecorretora.com.br/
         No campo "sourceUrl", inclua links ou nomes de referência correspondendo a estas imobiliárias ou plataformas tradicionais de onde simulou/coletou a amostra.
       - REQUISITO CRÍTICO DE GEOLOCALIZAÇÃO: É expressamente proibido alucinar ou introduzir nomes de logradouros (ruas, avenidas) que não existem na cidade real do imóvel avaliando. Os bairros e cidades fornecidos devem existir geograficamente na realidade dessa cidade específica.
       - REBATE DE ANÚNCIOS REAIS: A pesquisa deve refletir com absoluta fidelidade a informação coletada nos portais de vendas (ZAP Imóveis, VivaReal, OLX), sites de imobiliárias de Jaboticabal/SP, ou redes sociais. Como nesses canais é comum omitir a rua exata por motivos de privacidade, caso não seja possível identificar o logradouro real exato de uma amostra, a sua 'description' DEVE OBRIGATORIAMENTE conter APENAS o Bairro e a Cidade igualmente ao anúncio (por exemplo: "Jardim Paulista, Jaboticabal - SP" ou "Amostra no bairro Centro, Jaboticabal - SP"), de modo a não alucinar nenhuma rua inexistente na localidade.
    ${isTerrainOnly ? `Como o bem avaliando é um TERRENO SEM CONSTRUÇÃO, as amostras DEVEM ser terrenos vazios para fins de comparação homogênea.` : '2. Dê preferência absoluta a imóveis nas circunvizinhanças imediatas do avaliando.'}
    3. Para cada amostra, forneça dados precisos de mercado e um link (URL) fictício ou real de onde a amostra foi obtida (ex: ZAP Imóveis, VivaReal, ou sites de imobiliárias locais de Jaboticabal/SP mencionadas acima) para fins de auditoria.
    4. Calcule os fatores de homogeneização para cada amostra em relação ao imóvel avaliando seguindo rigorosamente a NBR-14653:
       - Cada fator deve corrigir o valor da amostra para que ela represente quanto valeria se tivesse as mesmas características do imóvel avaliando.
       - SE A AMOSTRA FOR SUPERIOR (MELHOR) que o imóvel avaliando na respectiva característica, aplique um fator MENOR que 1,00 para REDUZIR o valor da amostra (ex: 0,85, 0,90, 0,95). Exemplo: amostra melhor localizada, ou mais nova, ou de maior padrão construtivo, ou com mais vagas.
       - SE A AMOSTRA FOR INFERIOR (PIOR) que o imóvel avaliando na respectiva característica, aplique um fator MAIOR que 1,00 para AUMENTAR o valor da amostra (ex: 1,05, 1,10, 1,15). Exemplo: amostra pior localizada, ou mais antiga, ou de menor padrão construtivo, ou com menos vagas.
       - SE A AMOSTRA FOR EQUIVALENTE, aplique o fator de exatamente 1,00.
       - Fator Oferta (FO): Ajuste de negociação para anúncios de oferta. O fator oferta padrão deve ser obrigatoriamente 0,80 para aproximar ao valor de transação real. Se já for transação fechada, use 1,00. Seu padrão absoluto para anúncios deve ser sempre 0,80.
       - Fator Localização (FL): Razão de valorização da vizinhança.
       - Fator Área (FA): Coeficiente referente à diferença geométrica de tamanho.
       ${isTerrainOnly ? '' : `  - Fator Padrão (FP): Padrão construtivo e conservação.`}
       ${isTerrainOnly ? '' : `  - Fator Idade (FId): Depreciação física.`}
       - Fator Frente/Topografia (FT): Coeficiente para diferença de testada ou relevo.
       - Todos os fatores devem ser cumulativos e aplicados via MULTIPLICAÇÃO (nunca somados).
    5. Calcule o Valor Unitário Homogeneizado (Vu) para cada amostra de forma cumulativa e matemática:
       Vu = (ValorOferta * FO * FL * FA * ${isTerrainOnly ? 'FT' : 'FP * FId * FT'}) / ${isTerrainOnly ? 'Área do Terreno' : 'Área Construída'}.
     
    Retorne EXATAMENTE 10 amostras em JSON estrito.`;

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    let cleanedText = response.text.trim();
    if (cleanedText.startsWith("<!doctype") || cleanedText.startsWith("<html")) {
      return { error: "A API de Inteligência Artificial retornou uma resposta inválida em formato HTML. Verifique sua chave de acesso (API Key) nas configurações do AI Studio." };
    }
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.split("```json")[1].split("```")[0].trim();
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Gemini Appraisal Error:", error);
    const errorStr = String(error?.message || error || "");
    const isForbidden = errorStr.includes('403') || 
                        errorStr.toLowerCase().includes('forbidden') || 
                        errorStr.toLowerCase().includes('permission_denied') || 
                        errorStr.toLowerCase().includes('proibido') || 
                        errorStr.toLowerCase().includes('api_key') ||
                        errorStr.toLowerCase().includes('api key') ||
                        errorStr.toLowerCase().includes('unauthorized');
                        
    if (isForbidden) {
      return { 
        error: "Acesso Negado (403/Proibido). A sua chave GEMINI_API_KEY no painel de Configurações do AI Studio (Settings > Secrets) está inválida ou ausente. Por favor, adicione uma chave válida nas Configurações para habilitar a geração de amostras." 
      };
    }
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
      model: "gemini-2.5-flash",
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
    const isForbidden = errorMsg.includes('403') || 
                        errorMsg.toLowerCase().includes('forbidden') || 
                        errorMsg.toLowerCase().includes('permission_denied') || 
                        errorMsg.toLowerCase().includes('proibido') || 
                        errorMsg.toLowerCase().includes('api_key') ||
                        errorMsg.toLowerCase().includes('api key') ||
                        errorMsg.toLowerCase().includes('unauthorized');
                        
    if (isForbidden) {
      return "Erro de Acesso Negado (403/Proibido): A sua chave GEMINI_API_KEY no painel de Configurações (Settings > Secrets) do AI Studio está inválida, incorreta ou ausente. Por favor, adicione uma chave válida nas Configurações.";
    }
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      return "Erro: Limite de uso da IA excedido. Tente novamente em alguns instantes.";
    }
    return `Erro na análise da mídia: ${errorMsg}`;
  }
}

export async function generateQdezMarketingDiagnosis(
  propertyAddress: string,
  propertyArea: number,
  propertyBuiltArea: number,
  propertyAge: number,
  propertyConservation: string,
  propertyDescription: string,
  evaluatedValue: number
) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "API Key ausente nas configurações." };
  }

  const prompt = `Você é um Consultor Imobiliário de Alta Performance e Diretor de Captação Exclusiva na QDEZ IMÓVEIS.
    Seu objetivo é analisar os dados do imóvel abaixo e gerar dois relatórios vitais para a captação estratégica, seguindo estritamente a "CARTILHA QDEZ DE PRINCÍPIOS E ALTA PERFORMANCE":
    
    DADOS DO IMÓVEL:
    - Endereço do Imóvel: ${propertyAddress}
    - Área de Terreno: ${propertyArea}m²
    - Área Construída: ${propertyBuiltArea}m²
    - Idade do Imóvel: ${propertyAge} anos
    - Estado de Conservação: ${propertyConservation}
    - Descrição do Imóvel: ${propertyDescription}
    - Valor Avaliado de Mercado (Laudo NBR-14653): R$ ${evaluatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

    DIRETRIZES DA CARTILHA QDEZ A SEREM INCORPORADAS:
    1. Jeito QDEZ de Atuar: Visão consultiva. O corretor não é só divulgador, ele é "gestor de oportunidade". Valorizamos a representação de imóveis com estratégia e exclusividade para proteger o patrimônio do proprietário.
    2. Precificação Estratégica ("Preço protege tempo"): O preço correto é fundamental. O preço sugerido (R$ ${evaluatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) protege o imóvel de ficar queimado ou parado por muito tempo. Preço bom não é o maior, é o que gera mercado!
    3. Exclusividade Gera Valor: A representação exclusiva é um compromisso mútuo de entrega. Permite investimento em marketing de alta visibilidade, fotos limpas, iluminadas e estruturadas, relatórios de desempenho e controle na negociação.
    4. Diagnóstico Técnico de Campo: Desmembramos a captação em 6 etapas do POP 1: Diagnóstico (entender motivações, documentação, ocupação e urgências) e Análise (liquidez, conservação).
    
    GERAR:
    - "Parecer Técnico de Comercialização & Captação": Um texto persuasivo, consultivo e profissional em formato de parecer oficial para o proprietário. O parecer deve explicar a importância de manter o valor justo avaliado de R$ ${evaluatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, o impacto da representação estratégica exclusiva para impulsionar a divulgação, as estratégias comerciais robustas QDEZ e como conduziremos os leads de modo consultivo focado no relacionamento.
    - "Diagnóstico Rápido de Campo" (em campos separados):
      * occupancyType: "Vazio", "Com o Proprietário", "Alugado (Locação Vigente)" ou "Cedido/Outros" (faça uma inferência ou sugestão plausível baseada na descrição e nos dados do imóvel).
      * valuationItems: Lista de 4 ou 5 pontos fortes de valorização urbana em relação à sua localização (${propertyAddress}) e infraestrutura estimada (ex: acessos, proximidade de escola, comércios, zoneamento favorável, etc.).
      * attentionPoints: Lista de 3 ou 4 pontos de atenção recomendados para vistoria ou preparação estética (ex: pequenos reparos na pintura, inspeção de mofo/umidade em áreas molhadas, conferência de regularização da matrícula/averbação de construção, etc.).
      * recommendedExclusivityStrategy: Um roteiro adaptado e estratégico de abordagem ao proprietário demonstrando o compromisso QDEZ, explicando que com exclusividade a QDEZ investirá fortemente no imóvel e fornecerá relatórios quinzenais de prestação de contas.
      * marketingLaunchChannels: 4 ou 5 canais do plano de lançamento QDEZ (ex: Produção de fotos profissionais de padrão QDEZ, Vídeo Walkthrough vertical para WhatsApp e Instagram Stories, Placa corporativa no local, Lançamento no pool de portais integrados, Parcerias ativas com comissão garantida).
      
    Retorne a análise em formato JSON estrito correspondente ao schema.`;

  try {
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicalMarketingReport: { 
              type: Type.STRING, 
              description: "Parecer Técnico de Comercialização & Captação detalhado, formal e polido seguindo as premissas QDEZ" 
            },
            quickFieldDiagnosis: {
              type: Type.OBJECT,
              properties: {
                occupancyType: { type: Type.STRING },
                valuationItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                attentionPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                recommendedExclusivityStrategy: { type: Type.STRING },
                marketingLaunchChannels: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["occupancyType", "valuationItems", "attentionPoints", "recommendedExclusivityStrategy", "marketingLaunchChannels"]
            }
          },
          required: ["technicalMarketingReport", "quickFieldDiagnosis"]
        }
      }
    }));

    if (!response.text) return { error: "Sem resposta da IA." };
    let cleanedText = response.text.trim();
    if (cleanedText.startsWith("<!doctype") || cleanedText.startsWith("<html")) {
      return { error: "A API de Inteligência Artificial retornou uma resposta inválida em formato HTML. Verifique sua chave de acesso (API Key) nas configurações do AI Studio." };
    }
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.split("```json")[1].split("```")[0].trim();
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.split("```")[1].split("```")[0].trim();
    }
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Gemini QDEZ Diagnosis Error:", error);
    return { error: error?.message || "Erro desconhecido ao gerar o diagnóstico." };
  }
}

