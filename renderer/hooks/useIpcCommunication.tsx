import { useEffect } from "react";
import { IFiles } from "types";

export default function useIpcCommunication(setFiles) {
  useEffect(() => {
    window?.ipc?.on('file-selected', (res: string[]) => {
      setFiles(res.map((file) => ({
        uuid: Math.random().toString(36).substring(2),
        filePath: file,
      })));
    });

    const handleTaskStatusChange = (res: IFiles, key: string, status: string) => {
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.map((file) =>
          file.uuid === res?.uuid ? { ...file, [key]: status } : file
        );
        return updatedFiles;
      });
    };

    window?.ipc?.on('taskStatusChange', handleTaskStatusChange);

    return () => {
      // 清理监听器
    };
  }, []);
}