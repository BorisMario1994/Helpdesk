import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { ButtonLayout } from '../common/ButtonLayout';

type ManageBpbSuccessDialogProps = {
  open: boolean
  closePage: Function
  nomor: string
  mode: string
}

export function ManageBpbSuccessDialog({ open, closePage, nomor, mode }: ManageBpbSuccessDialogProps) {
  return (
    <Dialog open={open} onClose={() => {}} className="relative z-10">
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 duration-300 ease-out data-[closed]:opacity-0" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className="w-full max-w-md rounded-xl py-3 bg-white backdrop-blur-2xl duration-100 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
            <div className="flex flex-col items-center my-3 px-5 space-y-3">
              <span className="text-green-700"><FontAwesomeIcon icon={faCheckCircle} size="5x" /></span>
              <p className="text-xl font-bold">{nomor}</p>
              <p>{mode === "create" ? "BPB published successfully!" : mode === "revision" ? "BPB revised successfully!" : "BPB updated successfully!"}</p>
              <div className="w-16">
                <ButtonLayout text="OK" type="outline" colorClass="green-700" onClick={() => closePage()} />
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
