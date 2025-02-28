import { TranslationConfig, TranslationResult, Subtitle } from '../types';
import { THINK_TAG_REGEX, RESULT_TAG_REGEX, DEFAULT_BATCH_SIZE } from '../constants';
import { formatSubtitleContent } from '../utils/subtitle';
import { renderTemplate } from '../../helpers/utils';
import { logMessage } from '../../helpers/storeManager';
import { defaultBatchPrompt } from '../../../types';

export async function handleAISingleTranslation(
  subtitle: Subtitle,
  config: TranslationConfig
): Promise<TranslationResult> {
  const { provider, sourceLanguage, targetLanguage, translator } = config;
  const sourceContent = subtitle.content.join('\n');

  try {
    const translationContent = provider.prompt 
      ? renderTemplate(provider.prompt, {
          sourceLanguage,
          targetLanguage,
          content: sourceContent,
        })
      : sourceContent;

    const translationConfig = {
      ...provider,
      systemPrompt: provider.systemPrompt
    };
    logMessage(`AI translate single: \n ${translationContent}`, 'info');
    let targetContent = await translator(
      translationContent,
      translationConfig,
      sourceLanguage,
      targetLanguage
    );
    logMessage(`AI response: \n ${targetContent}`, 'info');
    targetContent = targetContent.replace(THINK_TAG_REGEX, '').trim();

    return {
      id: subtitle.id,
      startEndTime: subtitle.startEndTime,
      sourceContent,
      targetContent: targetContent.trim()
    };
  } catch (error) {
    logMessage(`Single translation error: ${error.message}`, 'error');
    throw error;
  }
}

export async function handleAIBatchTranslation(
  subtitles: Subtitle[],
  config: TranslationConfig,
  batchSize: number = DEFAULT_BATCH_SIZE.AI
): Promise<string[]> {
  const { provider, sourceLanguage, targetLanguage, translator } = config;
  const results: string[] = [];

  for (let i = 0; i < subtitles.length; i += batchSize) {
    const batch = subtitles.slice(i, i + batchSize);
    console.log(batch, 'batch');

    try {
      const fullContent = batch
        .map(formatSubtitleContent)
        .join('\n\n');

      const translationContent = renderTemplate(provider.batchPrompt || defaultBatchPrompt, {
        sourceLanguage,
        targetLanguage,
        content: fullContent,
      });

      const translationConfig = {
        ...provider,
        systemPrompt: provider.systemPrompt
      };

      logMessage(`AI translate batch ${i}: \n ${translationContent}`, 'info');
      const responseOrigin = await translator(
        translationContent,
        translationConfig,
        sourceLanguage,
        targetLanguage
      );
      logMessage(`AI response: \n ${responseOrigin}`, 'info');
      const response = responseOrigin.replace(THINK_TAG_REGEX, '').trim();
      const match = response.match(RESULT_TAG_REGEX);
      
      logMessage(`AI response: ${responseOrigin}`, 'info');
      results.push(match?.[1].trim() || response);
    } catch (error) {
      logMessage(`AI batch translation error: ${error.message}`, 'error');
      throw error;
    }
  }

  return results;
} 