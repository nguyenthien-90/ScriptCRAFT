import { GoogleGenAI, Type } from "@google/genai";
import { Genre, ClarificationQuestion, StoryBranch, ScriptAct } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateClarificationQuestions(genre: Genre, idea: string, duration: number, extraContext?: string): Promise<ClarificationQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a professional script consultant. Based on this idea for a ${duration} minute ${genre} film, generate 3-4 specific clarification questions to help refine the plot. Each question should have 3 distinct options for the user to choose from.
    Idea: ${idea}
    Additional Context: ${extraContext || "None"}
    IMPORTANT: Return the questions and options in Vietnamese (Tiếng Việt).
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "question", "options"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateStoryBranches(genre: Genre, idea: string, answers: Record<string, string>): Promise<StoryBranch[]> {
  const answersText = Object.entries(answers).map(([q, a]) => `Q: ${q}, A: ${a}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the initial idea and the user's choices, generate 3 distinct story directions (branches). Each should have a title and a 3-4 sentence description.
    Original Idea: ${idea}
    Genre: ${genre}
    User Choices:
    ${answersText}
    IMPORTANT: Return titles and descriptions in Vietnamese (Tiếng Việt).
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "title", "description"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateScriptStructure(genre: Genre, idea: string, selectedBranch: StoryBranch): Promise<ScriptAct[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Divide the following story direction into a standard 3-act structure with exactly 6 major plot points (2 per act).
    Story Direction: ${selectedBranch.title} - ${selectedBranch.description}
    Genre: ${genre}
    IMPORTANT: Return all act titles, act descriptions, plot point titles, and plot point descriptions in Vietnamese (Tiếng Việt).
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Act Title (e.g. Act I: Setup)" },
            description: { type: Type.STRING },
            plotPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "title", "description"]
              }
            }
          },
          required: ["title", "description", "plotPoints"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateSegmentDraft(segmentTitle: string, context: string): Promise<{ vi: string, en: string, zh: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a first draft for the following screenplay segment in THREE languages: Vietnamese, English, and Chinese (Simplified).
    Segment: ${segmentTitle}
    Full Context: ${context}
    Write in standard screenplay format (SCENE HEADING, Action, Character, Dialogue).
    Ensure the translation is consistent across all three versions.
    Return the result in JSON format with keys "vi", "en", and "zh".`,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vi: { type: Type.STRING },
          en: { type: Type.STRING },
          zh: { type: Type.STRING }
        },
        required: ["vi", "en", "zh"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function syncTranslations(baseContent: string, fromLang: string): Promise<{ vi: string, en: string, zh: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user has updated the ${fromLang} version of a screenplay segment. Please update the other two languages to perfectly match the new content, tone, and details of this version.
    
    Updated ${fromLang} Content:
    ${baseContent}

    Return the complete updated segment for all three languages (Vietnamese, English, Chinese Simplified) in JSON format with keys "vi", "en", and "zh".`,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vi: { type: Type.STRING },
          en: { type: Type.STRING },
          zh: { type: Type.STRING }
        },
        required: ["vi", "en", "zh"]
      }
    }
  });

  return JSON.parse(response.text);
}
