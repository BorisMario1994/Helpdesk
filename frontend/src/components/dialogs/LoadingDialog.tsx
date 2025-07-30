import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Loader2 } from "lucide-react";

export function LoadingDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open} onClose={() => {}} className="relative z-10">
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 duration-300 ease-out data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel transition className="max-w-lg space-y-4 bg-white p-10 rounded-xl duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0" >
          <div className="flex flex-col space-y-2 items-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <DialogTitle className="text-md font-semibold text-gray-800">Loading, please wait...</DialogTitle>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
