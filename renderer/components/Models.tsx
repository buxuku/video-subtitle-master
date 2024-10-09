import React, { FC } from 'react';
import { models } from 'lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'next-i18next';

interface IProps {
  modelsInstalled?: string[];
}
const Models: FC<SelectPrimitive.SelectProps & IProps> = (props) => {
  const { t } = useTranslation('common');
  return (
    <Select {...props}>
      <SelectTrigger
        className="items-start [&_[data-description]]:hidden"
        id="model"
      >
        <SelectValue placeholder={t('pleaseSelect')} />
      </SelectTrigger>
      <SelectContent>
        {models.map((item) => (
          <SelectItem value={item.name?.toLowerCase()} key={item.name}>
            <div className="flex items-start gap-3 text-muted-foreground">
              <div className="grid gap-0.5">
                <p>
                  {item.name}
                  {!props?.modelsInstalled?.includes(
                    item.name?.toLowerCase()
                  ) && `(${t('notInstalled')})`}
                </p>
                <p className="text-xs" data-description>
                  {t(item.desc.key)} {item.desc.size}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Models;
