import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TaskStatus from './TaskStatus';
import { isSubtitleFile } from 'lib/utils';
import { useTranslation } from 'next-i18next';

const TaskList = ({ files, formData }) => {
  const { t } = useTranslation('home');
  return (
    <Table>
      <TableCaption>{t('taskList')}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[500px]">{t('fileName')}</TableHead>
          <TableHead>{t('extractAudio')}</TableHead>
          <TableHead>{t('extractSubtitle')}</TableHead>
          <TableHead className="">{t('translateSubtitle')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="max-h-[80vh]">
        {files.map((file) => (
          <TableRow key={file?.uuid}>
            <TableCell className="font-medium">{file?.filePath}</TableCell>
            <TableCell>
              <TaskStatus
                file={file}
                checkKey="extractAudio"
                skip={isSubtitleFile(file?.filePath)}
              />
            </TableCell>
            <TableCell>
              <TaskStatus
                file={file}
                checkKey="extractSubtitle"
                skip={isSubtitleFile(file?.filePath)}
              />
            </TableCell>
            <TableCell className="">
              <TaskStatus
                file={file}
                checkKey="translateSubtitle"
                skip={formData.translateProvider === '-1'}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
export default TaskList;
