import OpenAI from "openai";
import { renderTemplate } from '../helpers/utils';

type OpenAIProvider = {
  apiUrl: string;
  apiKey: string;
  modelName?: string;
  prompt?: string;
};

export async function translateWithOpenAI(
  text: string,
  provider: OpenAIProvider,
  sourceLanguage: string,
  targetLanguage: string
) {
  const openai = new OpenAI({
    baseURL: provider.apiUrl,
    apiKey: provider.apiKey,
  });

  try {
    const systemPrompt = provider.prompt
      ? renderTemplate(provider.prompt, { sourceLanguage, targetLanguage, content: text })
      : `You are a helpful assistant that translates text from ${sourceLanguage} to ${targetLanguage}.`;

    const userPrompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${text}"`;

    const completion = await openai.chat.completions.create({
      model: provider.modelName || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    });

    return completion?.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw new Error(`OpenAI translation failed: ${error.message}`);
  }
}

export default translateWithOpenAI;