import { Textarea } from "@headlessui/react";
import React, { forwardRef } from "react";

type TextareaLayoutProps = {
  id: string;
  placeholder?: string;
  value?: string;
  isError?: boolean;
  onChange?: React.ChangeEventHandler;
};

export const TextareaLayout = forwardRef<HTMLTextAreaElement, TextareaLayoutProps>(({ id, placeholder = "", value = "", isError = false, onChange }: TextareaLayoutProps, ref) => {
  return <Textarea rows={3} ref={ref} name={id} id={id} placeholder={placeholder} defaultValue={value} onChange={onChange}
      className={`w-full px-3 py-2 ${isError && "bg-red-100"} border border-gray-400 rounded-lg text-sm resize-none data-[hover]:border-red-200 data-[hover]:shadow-md data-[hover]:shadow-red-200 data-[focus]:bg-red-100 data-[focus]:border data-[focus]:outline-red-300`} />;
});
