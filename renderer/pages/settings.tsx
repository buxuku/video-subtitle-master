import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'settings'
      ])),
    },
  }
}

const Settings = () => {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const form = useForm({
    defaultValues: {
      language: router.locale,
      // 在这里添加其他设置项的默认值
    }
  });

  useEffect(() => {
    // 从存储中加载设置
    const loadSettings = async () => {
      const settings = await window?.ipc?.invoke('getSettings');
      if (settings) {
        form.reset(settings);
        if (settings.language !== router.locale) {
          router.push(router.pathname, router.pathname, { locale: settings.language });
        }
      }
    };
    loadSettings();
  }, []);

  const onSubmit = async (data) => {
    // 保存设置
    await window?.ipc?.invoke('setSettings', data);
    
    // 更改语言
    if (data.language !== router.locale) {
      router.push(router.pathname, router.pathname, { locale: data.language });
    }
    
    // 显示成功消息
    toast.success(t('settingsSaved'));
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('language')}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh">{t('chinese')}</SelectItem>
                          <SelectItem value="en">{t('english')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* 在这里添加更多设置项 */}
              
              {/* 例如:
              <FormField
                control={form.control}
                name="otherSetting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('otherSettingLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              */}
              
              <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                {t('saveSettings')}
              </button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;