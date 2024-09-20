import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

// 定义翻译服务提供商类型
type TranslationProvider = {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
};

const TranslateControl: React.FC = () => {
  const [providers, setProviders] = useState<TranslationProvider[]>([]);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    // 组件加载时获取存储的配置
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const storedProviders = await window.ipc.invoke('getTranslationProviders');
    setProviders(storedProviders);
  };

  const handleInputChange = async (
    id: string,
    field: 'apiKey' | 'apiSecret',
    value: string
  ) => {
    const updatedProviders = providers.map((provider) =>
      provider.id === id ? { ...provider, [field]: value } : provider
    );
    setProviders(updatedProviders);
    // 保存更新后的配置
    window?.ipc?.send('setTranslationProviders', updatedProviders);
  };

  const togglePasswordVisibility = (
    id: string,
    field: 'apiKey' | 'apiSecret'
  ) => {
    setShowPassword((prev) => ({
      ...prev,
      [`${id}_${field}`]: !prev[`${id}_${field}`],
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">翻译服务管理</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>翻译服务提供商</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Secret</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Input
                    type={
                      showPassword[`${provider.id}_apiKey`]
                        ? 'text'
                        : 'password'
                    }
                    value={provider.apiKey}
                    onChange={(e) =>
                      handleInputChange(provider.id, 'apiKey', e.target.value)
                    }
                    className="mr-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      togglePasswordVisibility(provider.id, 'apiKey')
                    }
                  >
                    {showPassword[`${provider.id}_apiKey`] ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Input
                    type={
                      showPassword[`${provider.id}_apiSecret`]
                        ? 'text'
                        : 'password'
                    }
                    value={provider.apiSecret}
                    onChange={(e) =>
                      handleInputChange(
                        provider.id,
                        'apiSecret',
                        e.target.value
                      )
                    }
                    className="mr-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      togglePasswordVisibility(provider.id, 'apiSecret')
                    }
                  >
                    {showPassword[`${provider.id}_apiSecret`] ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TranslateControl;
