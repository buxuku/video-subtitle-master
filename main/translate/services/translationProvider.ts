import {
  Provider,
  TranslationResult,
  Subtitle,
  TranslatorFunction,
} from '../types';
import { handleAISingleTranslation, handleAIBatchTranslation } from './ai';
import { handleAPIBatchTranslation } from './api';
import { logMessage } from '../../helpers/storeManager';
import {
  volcTranslator,
  baiduTranslator,
  deeplxTranslator,
  ollamaTranslator,
  openaiTranslator,
  azureTranslator,
  azureOpenaiTranslator,
} from '../../service';
import { DEFAULT_BATCH_SIZE } from '../constants';

export const TRANSLATOR_MAP = {
  volc: volcTranslator,
  baidu: baiduTranslator,
  deeplx: deeplxTranslator,
  azure: azureTranslator,
  ollama: ollamaTranslator,
  azureopenai: azureOpenaiTranslator,
  openai: openaiTranslator,
  deepseek: openaiTranslator,
} as const;

export async function translateWithProvider(
  provider: Provider,
  subtitles: Subtitle[],
  sourceLanguage: string,
  targetLanguage: string,
  translator: TranslatorFunction,
  onProgress?: (progress: number) => void
): Promise<TranslationResult[] | string[]> {
  const config = {
    provider,
    sourceLanguage,
    targetLanguage,
    translator,
  };

  logMessage(
    `Translation started with provider: ${JSON.stringify(provider, null, 2)}`,
    'info'
  );

  if (provider.isAi) {
    if (provider.useBatchTranslation) {
      return handleAIBatchTranslation(
        subtitles,
        config,
        +provider.batchSize || DEFAULT_BATCH_SIZE.AI,
        onProgress
      );
    } else {
      const results: TranslationResult[] = [];
      const totalSubtitles = subtitles.length;
      for (let i = 0; i < totalSubtitles; i++) {
        const subtitle = subtitles[i];
        try {
          logMessage(`handleAISingleTranslation subtitle ${subtitle.id}`);
          const result = await handleAISingleTranslation(subtitle, config);
          onProgress && onProgress(i / totalSubtitles);
          results.push(result);
        } catch (error) {
          logMessage(
            `Translation failed for subtitle ${subtitle.id}: ${error.message}`,
            'error'
          );
          throw error;
        }
      }
      return results;
    }
  }

  return handleAPIBatchTranslation(subtitles, config, +provider.batchSize, onProgress);
}
