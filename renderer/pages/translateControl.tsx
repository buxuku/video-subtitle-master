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
import { Textarea } from '@/components/ui/textarea';

// 定义统一的服务提供商类型
type Provider = {
  id: string;
  name: string;
  type: 'api' | 'local';
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  modelName?: string;
  prompt?: string;
};

const TranslateControl: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const storedProviders = await window.ipc.invoke('getTranslationProviders');
    setProviders(storedProviders);
  };

  const handleInputChange = async (
    id: string,
    field: keyof Provider,
    value: string
  ) => {
    const updatedProviders = providers.map((provider) =>
      provider.id === id ? { ...provider, [field]: value } : provider
    );
    setProviders(updatedProviders);
    window?.ipc?.send('setTranslationProviders', updatedProviders);
  };

  const togglePasswordVisibility = (id: string, field: 'apiKey' | 'apiSecret') => {
    setShowPassword((prev) => ({
      ...prev,
      [`${id}_${field}`]: !prev[`${id}_${field}`],
    }));
  };

  const apiProviders = providers.filter(p => p.type === 'api');
  const localProviders = providers.filter(p => p.type === 'local');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">翻译服务管理</h1>
      
      <h2 className="text-xl font-bold mb-2">API 服务提供商</h2>
      <Table className="mb-8">
        <TableHeader>
          <TableRow>
            <TableHead>翻译服务提供商</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Secret</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiProviders.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Input
                    type={showPassword[`${provider.id}_apiKey`] ? 'text' : 'password'}
                    value={provider.apiKey}
                    onChange={(e) => handleInputChange(provider.id, 'apiKey', e.target.value)}
                    className="mr-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePasswordVisibility(provider.id, 'apiKey')}
                  >
                    {showPassword[`${provider.id}_apiKey`] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Input
                    type={showPassword[`${provider.id}_apiSecret`] ? 'text' : 'password'}
                    value={provider.apiSecret}
                    onChange={(e) => handleInputChange(provider.id, 'apiSecret', e.target.value)}
                    className="mr-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePasswordVisibility(provider.id, 'apiSecret')}
                  >
                    {showPassword[`${provider.id}_apiSecret`] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="text-xl font-bold mb-2">本地模型配置</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>模型名称</TableHead>
            <TableHead>API 地址</TableHead>
            <TableHead>模型名</TableHead>
            <TableHead>Prompt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localProviders.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>{provider.name}</TableCell>
              <TableCell>
                <Input
                  value={provider.apiUrl}
                  onChange={(e) => handleInputChange(provider.id, 'apiUrl', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={provider.modelName}
                  onChange={(e) => handleInputChange(provider.id, 'modelName', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Textarea
                  value={provider.prompt}
                  onChange={(e) => handleInputChange(provider.id, 'prompt', e.target.value)}
                  rows={3}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TranslateControl;
