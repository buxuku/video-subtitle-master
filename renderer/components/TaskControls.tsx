import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { isSubtitleFile } from 'lib/utils';

const TaskControls = ({ files, formData }) => {
  const [taskStatus, setTaskStatus] = useState('idle');
  useEffect(() => {
    window?.ipc?.on('taskComplete', (status: string) => {
      setTaskStatus(status);
    });
  }, []);
  const handleTask = async () => {
    if (!files?.length) {
      toast('消息通知', {
        description: '没有需要转换的视频',
      });
      return;
    }
    const isAllFilesProcessed = files.every((item) => {
      const basicProcessingDone = item.extractAudio && item.extractSubtitle;

      if (formData.translateProvider === '-1') {
        return basicProcessingDone;
      }
      if (isSubtitleFile(item?.filePath)) {
        return item.translateSubtitle;
      }

      return basicProcessingDone && item.translateSubtitle;
    });

    if (isAllFilesProcessed) {
      toast('消息通知', {
        description: '所有文件都处理完成',
      });
      return;
    }
    setTaskStatus('running');
    window?.ipc?.send('handleTask', { files, formData });
  };
  const handlePause = () => {
    window?.ipc?.send('pauseTask', null);
    setTaskStatus('paused');
  };

  const handleResume = () => {
    window?.ipc?.send('resumeTask', null);
    setTaskStatus('running');
  };

  const handleCancel = () => {
    window?.ipc?.send('cancelTask', null);
    setTaskStatus('cancelled');
  };
  return (
    <div className="flex gap-2 ml-auto">
      {(taskStatus === 'idle' || taskStatus === 'completed') && (
        <Button onClick={handleTask} disabled={!files.length}>
          开始操作
        </Button>
      )}
      {taskStatus === 'running' && (
        <>
          <Button onClick={handlePause}>暂停</Button>
          <Button onClick={handleCancel}>取消</Button>
        </>
      )}
      {taskStatus === 'paused' && (
        <>
          <Button onClick={handleResume}>继续</Button>
          <Button onClick={handleCancel}>取消</Button>
        </>
      )}
      {taskStatus === 'cancelled' && (
        <Button onClick={handleTask} disabled={!files.length}>
          重新开始
        </Button>
      )}
    </div>
  );
};

export default TaskControls;
