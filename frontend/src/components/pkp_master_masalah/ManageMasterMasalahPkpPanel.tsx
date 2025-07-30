import { Switch } from "@headlessui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import MasterMasalahPkp from "../../models/master/MasterMasalahPkp";

type ManageMasterMasalahPkpPanelProps = {
  mode: string;
  masterMasalahPkp: MasterMasalahPkp;
  traverseBack: () => void;
  showToast: (message: string) => void;
};

export function ManageMasterMasalahPkpPanel({ mode, masterMasalahPkp, traverseBack, showToast }: ManageMasterMasalahPkpPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const masalahInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(mode === "add" ? false : masterMasalahPkp.isActive);
  const [masalahInputError, setMasalahInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (masalahInput.current && btnSubmit.current) {
      if (masalahInput.current.value.length <= 0) {
        showToast("Master Masalah PKP data is incomplete. Cannot create Master Masalah PKP.");
        setMasalahInputError(masalahInput.current.value.length <= 0 ? "Masalah name field is empty." : "");
        return;
      }

      setIsSubmitting(true);
      try {
        const masterMasalahPkpData = new MasterMasalahPkp(mode === "add" ? -1 : masterMasalahPkp.code, masalahInput.current.value, isActive);
        if (mode === "add")
          await masterMasalahPkpData.createMasterMasalahPkpList();
        else if (mode === "edit")
          await masterMasalahPkpData.updateMasterMasalahPkpList();

        showToast(`Master Masalah PKP data has been ${mode === "add" ? "created" : "updated"}.`);
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
            showToast("The inserted Master Masalah PKP name was registered. Cannot create Master Masalah PKP.");
            break;
          default: 
            showToast("An error has occured when creating / updating Master Masalah PKP data. If the problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      <InputFieldLayout ref={masalahInput} label="Masalah Name" type="text" id="masalahInput" placeholder="Enter Masalah PKP name" errorText={masalahInputError} onInputChange={() => setMasalahInputError("")} enabled={!isSubmitting} value={masterMasalahPkp.masalah} /> 
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Active</p>
        <Switch checked={isActive} onChange={setIsActive} className="group inline-flex h-6 w-11 items-center rounded-full bg-red-700 transition data-checked:bg-green-700" >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
      </div>
      <ButtonLayout ref={btnSubmit} text={mode === "add" ? "Create" : "Update"} type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={submit} />
    </div>
  );
};
