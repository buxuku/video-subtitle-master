import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { ProviderField } from '../../types';
import { useTranslation } from 'next-i18next';
import { Switch } from '@/components/ui/switch';

interface ProviderFormProps {
  fields: ProviderField[];
  values: Record<string, any>;
  onChange: (key: string, value: string | boolean | number) => void;
  showPassword: Record<string, boolean>;
  onTogglePassword: (key: string) => void;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  fields,
  values,
  onChange,
  showPassword,
  onTogglePassword,
}) => {
  const { t } = useTranslation('translateControl');
  
  const renderField = (field: ProviderField) => {
    const value = values[field.key] ?? (field.defaultValue || '');
    switch (field.type) {
      case 'switch':
        return (
          <Switch
            className='ml-2 -mt-4'
            checked={!!value}
            onCheckedChange={(checked) => onChange(field.key, checked)}
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'password':
        return (
          <div className="flex items-center">
            <Input
              type={showPassword[field.key] ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="mr-2"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePassword(field.key)}
            >
              {showPassword[field.key] ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </Button>
          </div>
        );

      default:
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="grid gap-4">
      {fields.map((field) => {
        // 如果字段依赖于其他字段，检查依赖是否满足
        if (field.depends && !values[field.depends]) {
          return null;
        }

        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">
              {t(field.label)}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {renderField(field)}
            {field.tips && (
              <p
                className="text-xs text-gray-500"
                dangerouslySetInnerHTML={{ __html: t(field.tips) }}
              ></p>
            )}
          </div>
        );
      })}
    </div>
  );
};
