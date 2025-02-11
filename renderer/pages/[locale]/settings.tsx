import React, { useEffect, useState, useRef, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getStaticPaths, makeStaticProperties } from '../../lib/get-static';
import { Globe, Trash2, CloudDownload, Cog, HelpCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

const DEFAULT_COMMANDS = {
  WHISPER:
    'whisper "${audioFile}" --model ${whisperModel} --device cuda --output_format srt --output_dir "${outputDir}" --language ${sourceLanguage}',
  BUILTIN_WHISPER:
    '"${mainPath}" -m "${modelPath}" -f "${audioFile}" -osrt -of "${srtFile}" -l ${sourceLanguage}',
} as const;

// 新增一个 CommandInput 组件
const CommandInput = ({
  label,
  tooltip,
  value,
  onChange,
  onSave,
}: {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: SetStateAction<string>) => void;
  onSave: () => void;
}) => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
          placeholder={t('whisperCommandPlaceholder')}
        />
        <Button onClick={onSave} size="sm" className="flex-shrink-0">
          {t('save')}
        </Button>
      </div>
    </div>
  );
};

const Settings = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(router.locale);
  const [useLocalWhisper, setUseLocalWhisper] = useState(false);
  const [whisperCommand, setWhisperCommand] = useState(
    DEFAULT_COMMANDS.WHISPER
  );
  const [builtinWhisperCommand, setBuiltinWhisperCommand] = useState(
    DEFAULT_COMMANDS.BUILTIN_WHISPER
  );
  const form = useForm({
    defaultValues: {
      language: router.locale,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await window?.ipc?.invoke('getSettings');
      if (settings) {
        form.reset(settings);
        setCurrentLanguage(settings.language);
        setUseLocalWhisper(settings.useLocalWhisper || false);
        setWhisperCommand(settings.whisperCommand || DEFAULT_COMMANDS.WHISPER);
        setBuiltinWhisperCommand(
          settings.builtinWhisperCommand || DEFAULT_COMMANDS.BUILTIN_WHISPER
        );
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
      // 跳转到首页
      router.push(`/${i18n.language}/home`);
      toast.success(t('configClearedSuccess'));
    } else {
      toast.error(t('configClearFailed'));
    }
  };

  const handleLocalWhisperChange = async (checked: boolean) => {
    await window?.ipc?.invoke('setSettings', {
      useLocalWhisper: checked,
      whisperCommand: whisperCommand,
    });
    setUseLocalWhisper(checked);
  };

  // 统一的设置保存函数
  const saveSettings = async (settings: Partial<any>) => {
    try {
      await window?.ipc?.invoke('setSettings', settings);
      toast.success(t('commandSaved'));
    } catch (error) {
      toast.error(t('saveFailed'));
    }
  };

  const handleWhisperCommandSave = () => {
    saveSettings({
      useLocalWhisper,
      whisperCommand,
    });
  };

  const handleBuiltinCommandSave = () => {
    saveSettings({
      useLocalWhisper,
      whisperCommand,
      builtinWhisperCommand,
    });
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
            <Select
              onValueChange={handleLanguageChange}
              value={currentLanguage}
            >
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
            <CommandInput
              label={t('whisperCommand')}
              tooltip={t('whisperCommandTip')}
              value={whisperCommand}
              onChange={setWhisperCommand}
              onSave={handleWhisperCommandSave}
            />
          )}

          <CommandInput
            label={t('builtinWhisperCommand')}
            tooltip={t('builtinWhisperCommandTip')}
            value={builtinWhisperCommand}
            onChange={setBuiltinWhisperCommand}
            onSave={handleBuiltinCommandSave}
          />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

export const getStaticProps = makeStaticProperties(['common', 'settings']);

export { getStaticPaths };
