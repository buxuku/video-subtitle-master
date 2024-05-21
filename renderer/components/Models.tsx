import React, { FC } from "react";
import { models } from "lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IProps {
    modelsInstalled?: string[]
}
const Models: FC<SelectPrimitive.SelectProps & IProps> =  (props) => {
  return (
    <Select {...props}>
      <SelectTrigger
        className="items-start [&_[data-description]]:hidden"
        id="model"
      >
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent>
        {models.map((item) => (
          <SelectItem value={item.name?.toLowerCase()} key={item.name}>
            <div className="flex items-start gap-3 text-muted-foreground">
              <div className="grid gap-0.5">
                <p>{item.name}{!props?.modelsInstalled?.includes(item.name?.toLowerCase()) && '(未下载)'}</p>
                <p className="text-xs" data-description>
                  {item.desc}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Models;
