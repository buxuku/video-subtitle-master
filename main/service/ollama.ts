import axios from 'axios';
import { renderTemplate } from '../helpers/utils';

interface OllamaConfig {
  apiUrl: string;
  modelName: string;
  prompt: string;
}

export default async function translateWithOllama(
  text: string,
  config: OllamaConfig
) {
  const { apiUrl, modelName, prompt } = config;

  try {
    const response = await axios.post(`${apiUrl}/api/generate`, {
      model: modelName,
      prompt: text,
      stream: false
    });

    if (response.data && response.data.response) {
      return response.data.response.trim();
    } else {
      throw new Error(response?.data?.error || 'Unexpected response from Ollama');
    }
  } catch (error) {
    throw error;
  }
}