import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Switch } from "@headlessui/react";
import { useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";

type SettingsDialogProps = {
  open: boolean;
  closeDialog: Function;
  updateAllJobReg: Function;
  showToast: (message: string) => void;
}

export function UpdateAllJobRegistrationDialog({ open, closeDialog, updateAllJobReg, showToast }: SettingsDialogProps) {
  const auth = useAuth();

  const tsDateInput = useRef<HTMLInputElement>(null);
  const [selectedPic, setSelectedPic] = useState("");
  const [statusIsDone, setStatusIsDone] = useState(false);

  const update = () => {
    if (selectedPic.length <= 0) {
      showToast("PIC cannot be empty.");
      return;
    } else if (new Date(tsDateInput.current!.value).toString() === "Invalid Date") {
      showToast("TS date cannot be empty.");
      return;
    }
    
    updateAllJobReg(selectedPic, new Date(tsDateInput.current!.value), statusIsDone ? "DONE" : "WAITING");
    closeDialog();
  }

  return (
    <Dialog open={open} className="relative z-10 focus:outline-none" onClose={() => {}}>
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 duration-100 ease-out data-[closed]:opacity-0" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className="w-full max-w-md rounded-xl py-3 bg-white backdrop-blur-2xl duration-100 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
            <DialogTitle className="text-base/7 font-medium mx-3 px-2">
              <div className="flex justify-between">
                <p className="text-lg font-semibold text-red-500">Update All Job Registration</p>
                <CloseButton as={Button}><span className="text-red-400 cursor-pointer" onClick={() => closeDialog()}><FontAwesomeIcon icon={faClose}/></span></CloseButton>
              </div>
            </DialogTitle>
            <hr className="mt-3 mx-2 border-t-2 border-t-red-200" />
            <div className="flex flex-col px-5 my-3 gap-5">
              <p className="text-sm text-justify">Update All Job Registration is used to update all unassigned Job Registrations which still don't have PIC and TS with the values filled in this dialog's fields.</p>
              <div className="flex justify-between items-center mt-5">
                <p className="text-sm text-gray-500">PIC</p>
                <InputFieldLayout id="selectPic" type="select" options={[auth.scope?.username || "", ...(auth.scope?.inferior || [])]} value={selectedPic} onSelectChange={setSelectedPic} additionalClass="w-32" />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">TS (Target Selesai)</p>
                <InputFieldLayout ref={tsDateInput} id="tsDateInput" type="date" additionalClass="w-32" />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex gap-3">
                  <p className={`text-sm ${statusIsDone ? "text-green-700" : "text-yellow-500"} font-semibold`}>{statusIsDone ? "DONE" : "WAITING"}</p>
                  <Switch checked={statusIsDone} onChange={setStatusIsDone} className="group h-5 w-9 inline-flex items-center rounded-full bg-yellow-500 transition data-checked:bg-green-700">
                    <span className="size-3 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-5" />
                  </Switch>
                </div>
              </div>
              <div className="text-sm">
                <ButtonLayout text="Update" type="outline" colorClass="green-700" onClick={update} />
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

