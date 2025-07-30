import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ButtonLayout } from "../common/ButtonLayout";

type InformationDialogProps = {
  title: string;
  message: string;
  open: boolean;
  closeDialog: Function;
  blurBackground?: boolean;
};

export function InformationDialog({ title, message, open, closeDialog, blurBackground = false }: InformationDialogProps) {
  return (
    <Dialog open={open} className="relative z-10 focus:outline-none" onClose={() => {}}>
      <DialogBackdrop transition className={`fixed inset-0 bg-black/30 ${blurBackground && "backdrop-blur"} duration-100 ease-out data-[closed]:opacity-0`} />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className="w-full max-w-md rounded-xl py-3 bg-white backdrop-blur-2xl duration-100 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
            <DialogTitle className="text-base/7 font-medium mx-3 px-2">
              <div className="flex justify-between">
                <p className="text-lg font-semibold text-red-500">{title}</p>
                <CloseButton as={Button}><span className="text-red-400 cursor-pointer" onClick={() => closeDialog()}><FontAwesomeIcon icon={faClose}/></span></CloseButton>
              </div>
            </DialogTitle>
            <hr className="mt-3 mx-2 border-t-2 border-t-red-200" />
            <div className="px-5 my-3 space-y-5">
              <p className="text-sm">{message}</p>
              <div className="w-16 ml-auto">
                <ButtonLayout type="outline" text="OK" colorClass="green-700" onClick={() => closeDialog()} />
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

