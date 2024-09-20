import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supportedLanguage } from 'lib/utils';
import DownModel from './DownModel';
import DownModelLink from './DownModelLink';
import Models from './Models';
import SavePathNotice from './SavePathNotice';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

const TaskConfigForm = ({
  form,
  formData,
  systemInfo,
  updateSystemInfo,
  isInstalledModel,
}) => {
  return (
    <Form {...form}>
      <form className="grid w-full items-start gap-6">
        <fieldset className="grid gap-3 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">源字幕设置</legend>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模型选择</FormLabel>
                  <FormControl>
                    <Models
                      onValueChange={field.onChange}
                      value={field.value}
                      modelsInstalled={systemInfo.modelsInstalled}
                    />
                  </FormControl>
                  {!isInstalledModel && (
                    <FormDescription>
                      <DownModel
                        modelName={formData.model}
                        callBack={updateSystemInfo}
                      >
                        <DownModelLink />
                      </DownModel>
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="sourceLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>视频原始语言</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'auto'}>自动识别</SelectItem>
                        {supportedLanguage.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 mt-2">
            {/*<span>是否单独保存源字幕文件：</span>*/}
            <FormField
              control={form.control}
              name="saveSourceSrt"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center">
                  <FormLabel>是否单独保存源字幕文件</FormLabel>
                  <FormControl>
                    <Switch
                      onCheckedChange={field.onChange}
                      checked={field.value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {formData.saveSourceSrt && (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="sourceSrtSaveFileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        源字幕保存文件名设置
                        <SavePathNotice />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </fieldset>
        <fieldset className="grid gap-6 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">翻译设置</legend>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="translateProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>翻译服务</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'-1'}>不翻译</SelectItem>
                        <SelectItem value="baidu">百度</SelectItem>
                        <SelectItem value="volc">火山</SelectItem>
                        <SelectItem value="deeplx">deepLx</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>翻译目标语言</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguage.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="translateContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>翻译输出字幕设置</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onlyTranslate">
                          仅输出翻译字幕
                        </SelectItem>
                        <SelectItem value="sourceAndTranslate">
                          输出双语（源字幕加翻译字幕）
                        </SelectItem>
                        <SelectItem value="translateAndSource">
                          输出双语（翻译字幕加源字幕）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="targetSrtSaveFileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    翻译字幕保存文件名设置
                    <SavePathNotice />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </fieldset>
        <fieldset className="grid gap-3 rounded-lg border p-4">
          <legend className="-ml-1 px-1 text-sm font-medium">
            其它设置
          </legend>
          <FormField
            control={form.control}
            name="maxConcurrentTasks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最大并发任务数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="请输入最大并发任务数"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={1}
                    value={field.value || 1}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </fieldset>
      </form>
    </Form>
  );
};

export default TaskConfigForm;
