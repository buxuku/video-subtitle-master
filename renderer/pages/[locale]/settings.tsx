import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getStaticPaths, makeStaticProperties } from '../../lib/get-static'
import { Globe, Trash2, CloudDownload, Cog, HelpCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(router.locale);
  const [useLocalWhisper, setUseLocalWhisper] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [whisperCommand, setWhisperCommand] = useState(
    'whisper ${audioFile} --model ${whisperModel} --device cuda --output_format srt --output_dir ${outputDir} --language ${sourceLanguage}'
  );
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
        setUseLocalWhisper(settings.useLocalWhisper || false);
        setWhisperCommand(settings.whisperCommand || 'whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir ${path.dirname(srtFile)}');
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

  const handleLocalWhisperChange = async (checked: boolean) => {
    await window?.ipc?.invoke('setSettings', { 
      useLocalWhisper: checked,
      whisperCommand: whisperCommand 
    });
    setUseLocalWhisper(checked);
  };

  const handleWhisperCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhisperCommand(e.target.value);
  };

  const handleSaveWhisperCommand = async () => {
    await window?.ipc?.invoke('setSettings', { 
      useLocalWhisper,
      whisperCommand 
    });
    toast.success(t('commandSaved'));
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{t('useLocalWhisper')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('useLocalWhisperTip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={useLocalWhisper}
              onCheckedChange={handleLocalWhisperChange}
            />
          </div>
          {useLocalWhisper && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{t('whisperCommand')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('whisperCommandTip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  value={whisperCommand}
                  onChange={handleWhisperCommandChange}
                  className="font-mono text-sm"
                  placeholder={t('whisperCommandPlaceholder')}
                />
                <Button
                  onClick={handleSaveWhisperCommand}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

export const getStaticProps = makeStaticProperties(['common', 'settings'])

export { getStaticPaths }