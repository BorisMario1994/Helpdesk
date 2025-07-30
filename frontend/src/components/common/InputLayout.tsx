import { Input } from "@headlessui/react";
import React, { forwardRef } from "react";

type InputLayoutProps = {
  type: string;
  id: string;
  placeholder?: string;
  value?: string;
  isError?: boolean;
  onChange?: React.ChangeEventHandler;
  minDate?: string;
  withPrefixIcon?: boolean;
  withSuffixIcon?: boolean;
};

export const InputLayout = forwardRef<HTMLInputElement, InputLayoutProps>(({ type, id, placeholder = "", value = "", isError = false, onChange, minDate = "", withPrefixIcon = false, withSuffixIcon = false }: InputLayoutProps, ref) => {
  return <Input ref={ref} type={type} name={id} id={id} placeholder={placeholder} defaultValue={value} onChange={onChange} min={minDate}
      className={`w-full ${withPrefixIcon ? "ps-10" : "ps-3"} ${withSuffixIcon ? "pe-10" : "pe-3"} py-2 ${isError && "bg-red-100"} border border-gray-400 rounded-lg text-sm data-[hover]:border-red-200 data-[hover]:shadow-md data-[hover]:shadow-red-200 data-[focus]:bg-red-100 data-[focus]:border data-[focus]:outline-red-300`} />;
});
