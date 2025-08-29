
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function redrawCarImage(
    carImageBase64: string,
    backgroundImageBase64: string,
    carMimeType: string,
    backgroundMimeType: string,
    prompt: string
): Promise<{ image: string, text: string }> {

    const imageParts = [
        {
            text: prompt,
        },
        {
            inlineData: {
                data: carImageBase64,
                mimeType: carMimeType,
            },
        },
        {
            inlineData: {
                data: backgroundImageBase64,
                mimeType: backgroundMimeType,
            },
        },
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: imageParts,
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let generatedImage: string | null = null;
        let generatedText: string = "";

        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    const mimeType = part.inlineData.mimeType;
                    generatedImage = `data:${mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    generatedText += part.text;
                }
            }
        }

        if (!generatedImage) {
            throw new Error("API did not return an image. It might have been blocked.");
        }

        return { image: generatedImage, text: generatedText.trim() };

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while calling the Gemini API.");
    }
}