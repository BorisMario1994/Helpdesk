import { Switch } from "@headlessui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import HardwareMaster from "../../models/master/HardwareMaster";

type ManageHardwareMasterPanelProps = {
  mode: string;
  hardwareMaster: HardwareMaster;
  traverseBack: () => void;
  showToast: (message: string) => void;
};

export function ManageHardwareMasterPanel({ mode, hardwareMaster, traverseBack, showToast }: ManageHardwareMasterPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const hardwareMasterCodeInput = useRef<HTMLInputElement>(null);
  const hardwareMasterDescInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(mode === "add" ? false : hardwareMaster.isActive);
  const [hardwareMasterCodeInputError, setHardwareMasterCodeInputError] = useState("");
  const [hardwareMasterDescInputError, setHardwareMasterDescInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if ((mode === "edit" || (mode === "add" && hardwareMasterCodeInput.current)) && hardwareMasterDescInput.current) {
      if ((mode === "add" && (hardwareMasterCodeInput?.current?.value.length || 0) <= 0) || hardwareMasterDescInput.current.value.length <= 0) {
        showToast("Hardware Master data is incomplete.");
        setHardwareMasterCodeInputError(hardwareMasterCodeInput?.current?.value.length || 0 <= 0 ? "Hardware Master code field is empty." : "");
        setHardwareMasterDescInputError(hardwareMasterDescInput.current.value.length <= 0 ? "Description field is empty." : "");
        return;
      }

      setIsSubmitting(true);
      try {
        const hardwareMasterData = new HardwareMaster(mode === "add" ? hardwareMasterCodeInput?.current?.value : hardwareMaster.code, hardwareMasterDescInput.current.value, isActive);
        if (mode === "add")
          await hardwareMasterData.createHardwareMasterData();
        else if (mode === "edit")
          await hardwareMasterData.updateHardwareMasterData();

        showToast(`Hardware Master data has been ${mode === "add" ? "created" : "updated"}.`);
        traverseBack();
      } catch(err: any) {
        switch (err.response.data.name) {
          case "TokenExpired":
            await auth.refresh();
            return await submit();
          case "AuthorizationFailed":
            auth.logout();
            navigate("/login", { replace: true });
            break;
          case "RecordExists":
            showToast("Entered Hardware Master code was registered. Cannot create Hardware Master data.");
            break;
          default: 
            showToast("An error has occured when creating / updating Hardware Master data. If the problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      {
        mode === "add" 
        ? <InputFieldLayout ref={hardwareMasterCodeInput} label="Code" type="text" id="hardwareMasterCode" placeholder="Enter Hardware Master code" value="" errorText={hardwareMasterCodeInputError} /> 
        : <div>
            <p className="text-sm text-gray-500">Hardware Master Code</p>
            <p className="text-lg font-semibold text-red-500">{hardwareMaster.code}</p>
          </div>
      }
      <InputFieldLayout ref={hardwareMasterDescInput} label="Description" type="text" id="hardwareMasterDesc" placeholder="Enter Hardware Master description" value={hardwareMaster.descrption} errorText={hardwareMasterDescInputError} onInputChange={() => setHardwareMasterDescInputError("")} />
      <div className="flex justify-between items center">
        <p className="text-sm text-gray-500">Active</p>
        <Switch checked={isActive} onChange={setIsActive} className="group inline-flex h-6 w-11 items-center rounded-full bg-red-700 transition data-checked:bg-green-700" >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
      </div>
      <ButtonLayout ref={btnSubmit} text={mode === "add" ? "Create" : "Update"} type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={submit} />
    </div>
  );
};
