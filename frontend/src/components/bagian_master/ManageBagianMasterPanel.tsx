import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Switch } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import BagianMaster from "../../models/master/BagianMaster";

type ManageBagianMasterPanelProps = {
  mode: string;
  bagianMaster: BagianMaster;
  traverseBack: () => void;
  showToast: (message: string) => void;
}

export function ManageBagianMasterPanel({ mode, bagianMaster, traverseBack, showToast }: ManageBagianMasterPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [bagianMasterList, setBagianMasterList] = useState<BagianMaster[]>([]);

  const bagianMasterCodeInput = useRef<HTMLInputElement>(null);
  const bagianMasterNameInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [selectedUpperBagian, setSelectedUpperBagian] = useState("");
  const [isActive, setIsActive] = useState(mode === "add" ? false : bagianMaster.isActive);
  const [bagianMasterCodeInputError, setBagianMasterCodeInputError] = useState("");
  const [bagianMasterNameInputError, setBagianMasterNameInputError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const getRequiredData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      setBagianMasterList(await BagianMaster.getBagianMasterList());
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await submit();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          setIsError(true);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async () => {
    if ((mode === "edit" || (mode === "add" && bagianMasterCodeInput.current)) && bagianMasterNameInput.current) {
      if ((mode === "add" && (bagianMasterCodeInput?.current?.value.length || 0) <= 0) || bagianMasterNameInput.current.value.length <= 0) {
        showToast("Division / department data is incomplete.");
        setBagianMasterCodeInputError(bagianMasterCodeInput?.current?.value.length || 0 <= 0 ? "Division / department code is empty." : "");
        setBagianMasterNameInputError(bagianMasterNameInput.current.value.length <= 0 ? "Division / department name is empty." : "");
        return;
      }
  
      setIsSubmitting(true);
      try {
        const bagianMasterData = new BagianMaster(mode === "add" ? bagianMasterCodeInput?.current?.value : bagianMaster.code, bagianMasterNameInput.current.value, isActive, selectedUpperBagian === "EMPTY" ? null : selectedUpperBagian.split(" - ")[0]);
        if (mode === "add")
          await bagianMasterData.createBagianMasterData();
        else if (mode === "edit")
          await bagianMasterData.updateBagianMasterData();

        showToast(`Division / department data has been ${mode === "add" ? "created" : "updated"}.`);
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
            showToast("Entered Division / department code was registered. Cannot create division / department data.");
            break;
          default: 
            showToast("An error has occured when creating / updating division / department data. If the problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    getRequiredData();
  }, []);

  useEffect(() => {
    setSelectedUpperBagian(mode === "add" ? "" : !bagianMaster.upperBagianCode ? "EMPTY" : bagianMaster.upperBagianCode.concat(" - ", bagianMasterList.find(b => b.code === bagianMaster.upperBagianCode)?.descrption || ""));
  }, [bagianMasterList]);

  return isLoading ?
  (
    <div className="mx-auto my-10">
      <Loader2 className="mx-auto animate-spin text-red-500" size={40} />
      <p className="mt-3 text-sm">Loading, please wait...</p>
    </div>
  ) : isError ?
  (
    <div className="flex flex-col mt-10 px-5 space-y-5">
      <span className="self-center text-gray-400"><FontAwesomeIcon icon={faCircleExclamation} size="5x" /></span>
      <p className="self-center text-sm text-center">An error has occured when loading data from server. If the problem persist, please contact ISW.</p>
      <div className="mx-auto w-32 text-sm">
        <ButtonLayout text="Reload" type="outline" colorClass="red-500" onClick={getRequiredData} />
      </div>
    </div> 
  ) :
  (
    <div className="space-y-5">
      {
        mode === "add" 
        ? <InputFieldLayout ref={bagianMasterCodeInput} label="Code" type="text" id="bagianMasterCode" placeholder="Enter division / department code" value="" errorText={bagianMasterCodeInputError} /> 
        : <div>
            <p className="text-sm text-gray-500">Division / department Code</p>
            <p className="text-lg font-semibold text-red-500">{bagianMaster.code}</p>
          </div>
      }
      <InputFieldLayout ref={bagianMasterNameInput} label="Description" type="text" id="bagianMasterDesc" placeholder="Enter division / department description" value={bagianMaster.descrption} errorText={bagianMasterNameInputError} onInputChange={() => setBagianMasterNameInputError("")} />
      <InputFieldLayout label="Upper Div/Dept" type="select" id="upperBagianInput" options={[...(bagianMasterList.map((bagian) => `${bagian.code} - ${bagian.descrption}`)), "EMPTY"]} value={selectedUpperBagian} onSelectChange={setSelectedUpperBagian} />
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
