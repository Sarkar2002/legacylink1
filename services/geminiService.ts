
import { GoogleGenAI } from "@google/genai";
import type { FamilyMember } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API features will not be available.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateMemory = async (member: Pick<FamilyMember, 'name' | 'birthDate' | 'deathDate' | 'profession' | 'birthPlace'>): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. To enable this feature, please set the API_KEY environment variable.";
  }

  const prompt = `
    You are a historical fiction writer. Adopt the persona of the following person and write a short, reflective, first-person memory (around 100-150 words). 
    The memory should be a poignant or interesting anecdote from their life, inspired by their profession, time period, and location. It should sound authentic and personal.
    
    Character Details:
    - Name: ${member.name}
    - Lived from: ${member.birthDate} ${member.deathDate ? `to ${member.deathDate}` : ''}
    ${member.profession ? `- Role/Profession: ${member.profession}` : ''}
    ${member.birthPlace ? `- From: ${member.birthPlace}` : ''}
    
    Write the memory from their perspective, as if they are recalling it themselves. For example, start with "I remember..." or something similar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating memory with Gemini API:", error);
    return "There was an error generating the memory. This could be due to a configuration issue or a temporary problem with the service.";
  }
};