// Client-side Gemini API service communicating with the secure backend endpoints

export async function analyzeRoomMedia(
  base64Data: string,
  mimeType: string,
  userNotes?: string,
  inspectionType?: string
) {
  try {
    const response = await fetch('/api/gemini/analyze-room-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
        userNotes,
        inspectionType,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Erro ao processar análise de mídia.' };
    }
    return data;
  } catch (error: any) {
    console.error('Error in analyzeRoomMedia client:', error);
    return { error: error?.message || 'Falha de comunicação com o servidor de IA.' };
  }
}

export async function analyzeRoomMediaMultiple(
  mediaList: { data: string; mimeType: string }[],
  userNotes?: string,
  inspectionType?: string
) {
  try {
    const response = await fetch('/api/gemini/analyze-room-media-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaList,
        userNotes,
        inspectionType,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Erro ao processar análise de mídia unificada.' };
    }
    return data;
  } catch (error: any) {
    console.error('Error in analyzeRoomMediaMultiple client:', error);
    return { error: error?.message || 'Falha de comunicação com o servidor de IA.' };
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string | null> {
  try {
    const response = await fetch('/api/gemini/transcribe-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Audio,
        mimeType,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.text || null;
  } catch (error) {
    console.error('Error in transcribeAudio client:', error);
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
  try {
    const response = await fetch('/api/gemini/generate-appraisal-samples', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyAddress,
        propertyArea,
        propertyBuiltArea,
        propertyAge,
        propertyConservation,
        propertyCep,
        propertyNumber,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Erro ao gerar amostras comparativas.' };
    }
    return data;
  } catch (error: any) {
    console.error('Error in generateAppraisalSamples client:', error);
    return { error: error?.message || 'Falha de comunicação com o servidor de IA.' };
  }
}

export async function analyzeAppraisalMedia(
  mediaList: { data: string; mimeType: string }[],
  propertyDetails: string,
  samplesSummary: string
): Promise<string> {
  try {
    const response = await fetch('/api/gemini/analyze-appraisal-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaList,
        propertyDetails,
        samplesSummary,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return data.error || 'Erro ao analisar mídias do parecer.';
    }
    return data.text || '';
  } catch (error: any) {
    console.error('Error in analyzeAppraisalMedia client:', error);
    return `Erro de conexão com o servidor de IA: ${error?.message || error}`;
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
  try {
    const response = await fetch('/api/gemini/generate-qdez-marketing-diagnosis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyAddress,
        propertyArea,
        propertyBuiltArea,
        propertyAge,
        propertyConservation,
        propertyDescription,
        evaluatedValue,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Erro ao gerar diagnóstico QDEZ.' };
    }
    return data;
  } catch (error: any) {
    console.error('Error in generateQdezMarketingDiagnosis client:', error);
    return { error: error?.message || 'Falha de comunicação com o servidor de IA.' };
  }
}

export async function generateReplacementSamples(
  propertyAddress: string,
  propertyArea: number,
  propertyBuiltArea: number,
  propertyAge: number,
  propertyConservation: string,
  existingSamplesSummary: string,
  countToGenerate: number = 1,
  propertyCep?: string,
  propertyNumber?: string
) {
  try {
    const response = await fetch('/api/gemini/generate-replacement-samples', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyAddress,
        propertyArea,
        propertyBuiltArea,
        propertyAge,
        propertyConservation,
        existingSamplesSummary,
        countToGenerate,
        propertyCep,
        propertyNumber,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Erro ao gerar amostra de reposição.' };
    }
    return data;
  } catch (error: any) {
    console.error('Error in generateReplacementSamples client:', error);
    return { error: error?.message || 'Falha de comunicação com o servidor de IA.' };
  }
}

export async function compareInspectionPdfs(text1: string, text2: string) {
  const response = await fetch('/api/gemini/compare-pdfs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text1, text2 }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao comparar laudos em PDF.');
  }
  return data;
}
