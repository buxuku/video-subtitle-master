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

const TaskList = ({ files, formData }) => {
  return (
    <Table>
      <TableCaption>已经导入的视频列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[500px]">视频文件名</TableHead>
          <TableHead>提取音频</TableHead>
          <TableHead>生成字幕</TableHead>
          <TableHead className="">翻译字幕</TableHead>
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
