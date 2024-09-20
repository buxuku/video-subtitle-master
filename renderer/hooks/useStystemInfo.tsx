import { useEffect, useState } from 'react';
import { ISystemInfo } from 'types';

export default function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<ISystemInfo>({
    whisperInstalled: true,
    modelsInstalled: [],
  });

  const updateSystemInfo = async () => {
    const systemInfoRes = await window?.ipc?.invoke('getSystemInfo', null);
    setSystemInfo(systemInfoRes);
  };

  useEffect(() => {
    updateSystemInfo();
  }, []);

  return { systemInfo, updateSystemInfo };
}
