import { useTranslation } from "next-i18next";
import React, { FC } from "react";

interface IProps {
  loading?: boolean;
  progress?: number;
  handleDownModel?: () => void;
}
const DownModelLink: FC<IProps> = ({ loading, progress, handleDownModel }) => {
  const { t } = useTranslation('common');
  return (
    <span className="inline-block">
      {t('modelNotDownloaded')}
      {loading ? (
        `${t('downloading')} ${progress}%...`
      ) : (
        <a
          className="cursor-pointer text-blue-500"
          onClick={() => handleDownModel()}
        >
          {t('downloadNow')}
        </a>
      )}
    </span>
  );
};

export default DownModelLink;
