import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Label } from "@headlessui/react";
import React, { forwardRef, useEffect, useState } from "react";
import { InputLayout } from "./InputLayout";
import { SelectLayout } from "./SelectLayout";
import { TextareaLayout } from "./TextareaLayout";
import { ComboBoxLayout } from "./ComboBoxLayout";

type InputFieldLayoutProps = {
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  options?: string[];
  value?: string;
  errorText?: string;
  enabled?: boolean;
  onInputChange?: React.ChangeEventHandler;
  onSelectChange?: (value: string) => void;
  additionalClass?: string;
  minDate?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
};

export const InputFieldLayout = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputFieldLayoutProps>(({ type, id, label = "", placeholder = "", options = [], value = "", errorText = "", enabled = true, onInputChange, onSelectChange, minDate = "", additionalClass = "", prefixIcon, suffixIcon }: InputFieldLayoutProps, ref) => {
  const [inputType, setInputType] = useState(type);
  const [passwordInputVisible, setPasswordInputVisible] = useState(false)

  useEffect(() => {
    if (type === "password")
      setInputType(passwordInputVisible ? "text" : "password")
  }, [passwordInputVisible])

  return (
    <Field disabled={!enabled} className={`${additionalClass}`}>
      <Label className={`text-sm text-gray-500 ${label.length === 0 && "hidden"}`} htmlFor={id}>{label}</Label>
      <div className="w-full flex relative mt-1">
        {
          prefixIcon && <span className="absolute start-3 top-2 text-gray-400">{prefixIcon}</span>
        }
        {
          (type === "select" && <SelectLayout id={id} options={options || []} value={value} isError={errorText.length > 0} onChange={onSelectChange} />) || 
          (type === "combobox" && <ComboBoxLayout id={id} options={options || []} value={value} isError={errorText.length > 0} onChange={onSelectChange} />) || 
          (type === "textarea" && <TextareaLayout ref={ref as React.RefObject<HTMLTextAreaElement | null>} id={id} placeholder={placeholder} value={value} isError={errorText.length > 0} onChange={onInputChange} />) || 
          (type !== "select" && type !== "textarea" && <InputLayout ref={ref as React.RefObject<HTMLInputElement | null>} type={inputType} id={id} placeholder={placeholder} value={value} isError={errorText.length > 0} onChange={onInputChange} minDate={minDate} withPrefixIcon={prefixIcon !== undefined} withSuffixIcon={type === "password" || suffixIcon !== undefined} />) 
        }
        {
          (type === "password" && 
          (<span className="absolute end-3 top-2 cursor-pointer text-gray-400" onClick={() => { setPasswordInputVisible(!passwordInputVisible) }}>
            <FontAwesomeIcon icon={passwordInputVisible ? faEye : faEyeSlash} />
          </span>)) ||
          (suffixIcon && <span className="absolute end-3 top-2 text-gray-400">{suffixIcon}</span>)
        }
      </div>
      <span className={`text-xs text-red-400 ${(errorText !== undefined && errorText !== null && errorText.length > 0) || "hidden"}`}>{errorText}</span>
    </Field>
  );
});
