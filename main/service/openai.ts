import OpenAI, { AzureOpenAI } from "openai";

type OpenAIProvider = {
  id: string;
  apiUrl: string;
  apiKey: string;
  modelName?: string;
  prompt?: string;
};

export async function translateWithOpenAI(
  text: string,
  provider: OpenAIProvider,
) {
  let openai;
  
  if (provider.id === 'azure') {
    // 处理Azure OpenAI的endpoint URL
    const url = new URL(provider.apiUrl);
    const pathParts = url.pathname.split('/');
    const deploymentName = pathParts[pathParts.indexOf('deployments') + 1];
    const apiVersion = url.searchParams.get('api-version') || '2023-05-15'; // 添加默认API版本
    const baseURL = `${url.protocol}//${url.host}/`;

    openai = new AzureOpenAI({
      endpoint: baseURL,
      apiKey: provider.apiKey,
      deployment: deploymentName,
      apiVersion: apiVersion, // 显式设置apiVersion
    });
  } else {
    openai = new OpenAI({
      baseURL: provider.apiUrl,
      apiKey: provider.apiKey,
    });
  }

  try {
    const systemPrompt = 'You are a professional subtitle translation tool';
    const userPrompt = text;
    const completion = await openai.chat.completions.create({
      model: provider.id === 'azure' ? undefined : (provider.modelName || "gpt-3.5-turbo"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    });

    const result = completion?.choices?.[0]?.message?.content?.trim();

    console.log('OpenAI Prompt & Result:', {
      prompt: {
        systemPrompt: systemPrompt,
        userPrompt: userPrompt
      },
      result
    });

    return result;
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw new Error(`OpenAI translation failed: ${error.message}`);
  }
}

export default translateWithOpenAI;