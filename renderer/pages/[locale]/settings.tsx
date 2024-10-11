import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getStaticPaths, makeStaticProperties } from '../../lib/get-static'
import { Globe, Trash2, CloudDownload, Cog } from 'lucide-react'; 

const Settings = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(router.locale);
  const form = useForm({
    defaultValues: {
      language: router.locale,
    }
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await window?.ipc?.invoke('getSettings');
      if (settings) {
        form.reset(settings);
        setCurrentLanguage(settings.language);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = async (value) => {
    await window?.ipc?.invoke('setSettings', { language: value });
    if (value !== i18n.language) {
      router.push(`/${value}/settings`);
    }
  };

  const handleReinstallWhisper = async () => {
    setIsReinstalling(true);
    try {
      const result = await window?.ipc?.invoke('reinstallWhisper');
      if (result) {
        toast.success(t('whisperDeleted'));
        router.push(`/${i18n.language}/home`);
      } else {
        toast.error(t('whisperDeleteFailed'));
      }
    } catch (error) {
      toast.error(t('whisperDeleteFailed'));
    } finally {
      setIsReinstalling(false);
    }
  };

  const handleClearConfig = async () => {
    const result = await window?.ipc?.invoke('clearConfig');
      if (result) {
        toast.success(t('configClearedSuccess'));
      } else {
        toast.error(t('configClearFailed'));
      }
  };


  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2" />
            {t('languageSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>{t('changeLanguage')}</span>
            <Select onValueChange={handleLanguageChange} value={currentLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">{t('chinese')}</SelectItem>
                <SelectItem value="en">{t('english')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cog className="mr-2" />
            {t('systemSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t('clearConfig')}</span>
            <Button 
              onClick={handleClearConfig}
              variant="destructive"
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('clear')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('reinstallWhisper')}</span>
            <Button 
              onClick={handleReinstallWhisper}
              disabled={isReinstalling}
              className="flex items-center"
            >
              <CloudDownload className="mr-2 h-4 w-4" />
              {isReinstalling ? t('reinstallingWhisper') : t('reinstall')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

export const getStaticProps = makeStaticProperties(['common', 'settings'])

export { getStaticPaths }