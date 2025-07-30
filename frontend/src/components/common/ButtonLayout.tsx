import { Button } from "@headlessui/react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

type ButtonLayoutProps = {
  text: string;
  type: "solid" | "outline" | "text";
  colorClass: string;
  enabled?: boolean;
  loading?: boolean;
  onClick?: React.MouseEventHandler;
};

export const ButtonLayout = forwardRef<HTMLButtonElement, ButtonLayoutProps>(({ text, type, colorClass, enabled = true, loading = false, onClick }: ButtonLayoutProps, ref) => {
  const colorStyles: Record<string, string> = {
    "solid & red-500": "bg-red-500 border-red-500 text-white hover:bg-red-500 data-[disabled]:bg-gray-400 data-[disabled]:border-gray-400",
    "solid & blue-500": "bg-blue-500 border-blue-500 text-white hover:bg-blue-500 data-[disabled]:bg-gray-400 data-[disabled]:border-gray-400",
    "solid & yellow-500": "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-500 data-[disabled]:bg-gray-400 data-[disabled]:border-gray-400",
    "solid & green-700": "bg-green-700 border-green-700 text-white hover:bg-green-700 data-[disabled]:bg-gray-400 data-[disabled]:border-gray-400",
    "outline & red-500": "bg-transparent border-red-500 text-red-500 data-[hover]:bg-red-500 data-[hover]:text-white data-[disabled]:border-gray-400 data-[disabled]:text-gray-400",
    "outline & blue-500": "bg-transparent border-blue-500 text-blue-500 data-[hover]:bg-blue-500 data-[hover]:text-white data-[disabled]:border-gray-400 data-[disabled]:text-gray-400",
    "outline & yellow-500": "bg-transparent border-yellow-500 text-yellow-500 data-[hover]:bg-yellow-500 data-[hover]:text-white data-[disabled]:border-gray-400 data-[disabled]:text-gray-400",
    "outline & green-700": "bg-transparent border-green-700 text-green-700 data-[hover]:bg-green-700 data-[hover]:text-white data-[disabled]:border-gray-400 data-[disabled]:text-gray-400",
    "text & red-500": "bg-transparent text-red-500 underline data-[disabled]:text-gray-400",
    "text & blue-500": "bg-transparent text-blue-500 underline data-[disabled]:text-gray-400",
    "text & yellow-500": "bg-transparent text-yellow-500 underline data-[disabled]:text-gray-400",
    "text & green-700": "bg-transparent text-green-700 underline data-[disabled]:text-gray-400",
    // Add more explicitly
  };

  const classNames = clsx(
    "w-full rounded-full data-[hover]:font-semibold",
    type !== "text" && "px-2 py-1 border-2",
    colorStyles[`${type} & ${colorClass}`]
  );

  return (
    <Button ref={ref} className={classNames} onClick={onClick} disabled={!enabled}>
      <span className={`${!loading || "hidden"}`}>{text}</span>
      <Loader2 className={`${loading || "hidden"} animate-spin mx-auto`} size={30} />
    </Button>
  );
});

