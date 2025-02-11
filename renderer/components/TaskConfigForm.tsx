import React, { useEffect, useState } from 'react';
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supportedLanguage } from 'lib/utils';
import DownModel from './DownModel';
import DownModelLink from './DownModelLink';
import Models from './Models';
import SavePathNotice from './SavePathNotice';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useTranslation } from 'next-i18next';

// 定义 Provider 类型
type Provider = {
  id: string;
  name: string;
  type: 'api' | 'local' | 'openai';
};

const TaskConfigForm = ({
  form,
  formData,
  systemInfo,
  updateSystemInfo,
  isInstalledModel,
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const storedProviders = await window.ipc.invoke('getTranslationProviders');
    setProviders(storedProviders);
  };
  if(!providers.length) return null;
  return (
    <Form {...form}>
      <form className="grid w-full items-start gap-6">
        <fieldset className="grid gap-4 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">{t('sourceSubtitleSettings')}</legend>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modelSelection')}</FormLabel>
                  <FormControl>
                    <Models
                      onValueChange={field.onChange}
                      value={field.value}
                      modelsInstalled={systemInfo.modelsInstalled}
                    />
                  </FormControl>
                  {!isInstalledModel && field.value && (
                    <FormDescription>
                      <DownModel
                        modelName={field.value}
                        callBack={updateSystemInfo}
                        key={field.value}
                      >
                        <DownModelLink />
                      </DownModel>
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="sourceLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('originalLanguage')}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pleaseSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'auto'}>{t('autoRecognition')}</SelectItem>
                        {supportedLanguage.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {tCommon(`language.${item.value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="sourceSrtSaveOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center'>
                    {t('sourceSubtitleSaveSettings')}
                    <SavePathNotice />
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || 'noSave'}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pleaseSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="noSave">{t('noSave')}</SelectItem>
                        <SelectItem value="fileName">{t('fileName')}</SelectItem>
                        <SelectItem value="fileNameWithLang">{t('fileNameWithLang')}</SelectItem>
                        <SelectItem value="custom">{t('customSettings')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            {formData.sourceSrtSaveOption === 'custom' && (
              <FormField
                control={form.control}
                name="customSourceSrtFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder={t('pleaseInputCustomSourceSrtFileName')} {...field} value={field.value || '${fileName}.${sourceLanguage}'} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </fieldset>
        <fieldset className="grid gap-4 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">{t('translationSettings')}</legend>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="translateProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translationService')}</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('pleaseSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'-1'}>{t('Untranslate')}</SelectItem>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {tCommon(`provider.${provider.id}`, { defaultValue: provider.id })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('translationTargetLanguage')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('pleaseSelect')} />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguage.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {tCommon(`language.${item.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="translateContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translationOutputSubtitleSettings')}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pleaseSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onlyTranslate">
                          {t('onlyOutputTranslationSubtitle')}
                        </SelectItem>
                        <SelectItem value="sourceAndTranslate">
                          {t('sourceAndTranslate')}
                        </SelectItem>
                        <SelectItem value="translateAndSource">
                          {t('translateAndSource')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="targetSrtSaveOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    {t('translationSubtitleSaveSettings')}
                    <SavePathNotice />
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || 'fileNameWithLang'}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('pleaseSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fileName">{t('fileName')}</SelectItem>
                        <SelectItem value="fileNameWithLang">{t('fileNameWithLang')}</SelectItem>
                        <SelectItem value="custom">{t('customSettings')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            {formData.targetSrtSaveOption === 'custom' && (
              <FormField
                control={form.control}
                name="customTargetSrtFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder={t('pleaseInputCustomTargetSrtFileName')} {...field} value={field.value || '${fileName}.${targetLanguage}'} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </fieldset>
        <fieldset className="grid gap-4 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">
            {t('otherSettings')}
          </legend>
          <FormField
            control={form.control}
            name="maxConcurrentTasks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('maxConcurrentTasks')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('pleaseInputMaxConcurrentTasks')}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={1}
                    value={field.value || 1}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </fieldset>
      </form>
    </Form>
  );
};

export default TaskConfigForm;