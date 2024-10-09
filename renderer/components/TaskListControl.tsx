import { Import } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'next-i18next';

const TaskListControl = ({ setFiles }) => {
  const { t } = useTranslation('home');
  const handleImportVideo = async () => {
    window?.ipc?.send('openDialog', 'openDialog');
  };

  const handleClearList = () => {
    window.ipc.send('clearTasks', []);
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
        {t('clearList')}
      </Button>
      <Button
        className="text-sm ml-4"
        size="sm"
        variant="outline"
        onClick={handleImportVideo}
      >
        <Import className="size-5 mr-2" />
        {t('importFiles')}
      </Button>
    </div>
  );
};

export default TaskListControl;
