import { Import } from 'lucide-react';
import { Button } from './ui/button';

const TaskListControl = ({ setFiles }) => {
  const handleImportVideo = async () => {
    window?.ipc?.send('openDialog', 'openDialog');
  };

  const handleClearList = () => {
    setFiles([]);
  };
  return (
    <div className="align-middle items-center flex justify-end">
      <Button
        className="text-sm"
        size="sm"
        variant="outline"
        onClick={handleClearList}
      >
        清空列表
      </Button>
      <Button
        className="text-sm ml-4"
        size="sm"
        variant="outline"
        onClick={handleImportVideo}
      >
        <Import className="size-5 mr-2" />
        导入视频/音频/字幕
      </Button>
    </div>
  );
};

export default TaskListControl;
