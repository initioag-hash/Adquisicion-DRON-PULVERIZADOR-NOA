
import { GoogleGenAI } from "@google/genai";
import { SimulationState, CalculationResults } from "../types";

export const getStrategicRecommendation = async (
  state: SimulationState,
  results: CalculationResults
): Promise<string> => {
  // Always use a named parameter and process.env.API_KEY directly.
  // We initialize the client right before the call to ensure the latest key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Actúa como un Consultor de Estrategia Agrotecnológica experto en el NOA (Tucumán, Argentina). 
    Analiza los siguientes resultados de un simulador de ROI para drones DJI Agras:
    
    - Modelo: ${state.droneModel}
    - Inversión: USD ${state.investmentAmount}
    - Beneficio Neto Anual: USD ${results.beneficioNetoAnual.toFixed(2)}
    - Payback: ${results.paybackYears.toFixed(1)} años
    - Punto de Equilibrio: ${results.breakEvenHa.toFixed(0)} hectáreas totales
    - Ahorro Manchoneo: USD ${results.ahorroManchoneo.toFixed(2)}
    - Valor Recuperado por no pisado: USD ${results.valorCapturadoPisado.toFixed(2)}
    
    Variables de Mercado: Soja USD ${state.marketPrices.soja}/tn.
    Variables de Eficiencia: ${state.efficiency.ahorroManchoneoPct}% ahorro en manchoneo.
    
    Proporciona una recomendación estratégica breve y potente (máximo 3 párrafos) enfocada en la toma de decisiones basada en estos datos.
    Menciona si la rentabilidad del manchoneo supera a la cobertura total o viceversa dado el precio actual.
    Usa un tono profesional y analítico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use the .text property directly instead of .text()
    return response.text || "No se pudo generar la recomendación en este momento.";
  } catch (error) {
    console.error("Error generating AI recommendation:", error);
    return "Error al conectar con el consultor virtual. Por favor, revisa tu conexión.";
  }
};
