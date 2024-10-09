import React, { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


import { ScrollArea } from '@/components/ui/scroll-area';

import Guide from '@/components/Guide';

import useSystemInfo from 'hooks/useStystemInfo';
import useFormConfig from 'hooks/useFormConfig';
import useIpcCommunication from 'hooks/useIpcCommunication';
import TaskControls from '@/components/TaskControls';
import TaskList from '@/components/TaskList';
import TaskConfigForm from '@/components/TaskConfigForm';
import TaskListControl from '@/components/TaskListControl';


export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'home'
      ])),
    },
  }
}


export default function Component() {
  const [files, setFiles] = useState([]);
  const { systemInfo, updateSystemInfo } = useSystemInfo();
  const { form, formData } = useFormConfig();
  useIpcCommunication(setFiles);

  const isInstalledModel = systemInfo?.modelsInstalled?.includes(
    formData.model?.toLowerCase()
  );
  useEffect(() => {
    const loadTasks = async () => {
      const tasks = await window.ipc.invoke('getTasks');
      setFiles(tasks);
    };
    loadTasks();
  }, []);

  useEffect(() => {
    window.ipc.send('setTasks', files);
  }, [files]);
  
  return (
    <div className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="relative hidden flex-col items-start gap-8 md:flex">
        <TaskConfigForm
          form={form}
          formData={formData}
          systemInfo={systemInfo}
          updateSystemInfo={updateSystemInfo}
          isInstalledModel={isInstalledModel}
        />
      </div>
      <div className="relative flex h-full min-h-[50vh] border flex-col rounded-xl p-4 lg:col-span-2">
        <TaskListControl setFiles={setFiles} />
        <ScrollArea className="max-h-[780px]">
          <TaskList files={files} formData={formData} />
        </ScrollArea>
        <div className="flex-1" />
        <TaskControls formData={formData} files={files} />
      </div>
      <Guide systemInfo={systemInfo} updateSystemInfo={updateSystemInfo} />
    </div>
  );
}
