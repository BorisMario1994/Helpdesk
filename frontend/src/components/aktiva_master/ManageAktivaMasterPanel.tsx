/*
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import AktivaMaster from "../../models/AktivaMaster";
import HardwareMaster from "../../models/HardwareMaster";

type ManageBagianMasterPanelProps = {
  mode: string;
  aktivaMaster: AktivaMaster;
  traverseBack: () => void;
  showToast: (message: string) => void;
};

export function ManageAktivaMasterPanel({ mode, aktivaMaster, traverseBack, showToast }: ManageBagianMasterPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [hardwareMasterList, setHardwareMasterList] = useState<HardwareMaster[]>([]);

  const aktivaCodeInput = useRef<HTMLInputElement>(null);
  const aktivaDescInput = useRef<HTMLInputElement>(null);
  const remarksInput = useRef<HTMLInputElement>(null);
  const merkInput = useRef<HTMLInputElement>(null);
  const tanggalPembelianInput = useRef<HTMLInputElement>(null);
  const batasGaransiInput = useRef<HTMLInputElement>(null);
  const tanggalAfkirInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [selectedHardwareMaster, setSelectedHardwareMaster] = useState("Select one");
  const [aktivaCodeInputError, setAktivaCodeInputError] = useState("");
  const [aktivaDescInputError, setAktivaDescInputError] = useState("");
  const [hardwareTypeInputError, setHardwareTypeInputError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const getRequiredData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      setHardwareMasterList(await HardwareMaster.getHardwareMasterList());
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
    if ((mode === "edit" || (mode === "add" && aktivaCodeInput.current)) && aktivaDescInput.current) {
      if ((mode === "add" && (aktivaCodeInput?.current?.value.length || 0) <= 0) || aktivaDescInput.current.value.length <= 0 || selectedHardwareMaster.trim().length <= 0) {
        showToast("Aktiva data is incomplete. Cannot create / update aktiva data.");
        setAktivaCodeInputError(aktivaCodeInput?.current?.value.length || 0 <= 0 ? "Aktiva code is empty." : "");
        setAktivaDescInputError(aktivaDescInput.current.value.length <= 0 ? "Description is empty." : "");
        setHardwareTypeInputError(selectedHardwareMaster.trim().length <= 0 ? "Hardware type not selected." : "");
        return;
      }
  
      setIsSubmitting(true);
      try {
        const aktivaMasterData = new AktivaMaster(mode === "add" ? aktivaCodeInput?.current?.value : aktivaMaster.kodeAktiva, selectedHardwareMaster.split(" - ")[0], aktivaDescInput.current.value, merkInput.current?.value, remarksInput.current?.value, new Date(tanggalPembelianInput.current?.value || "1900-01-01"), new Date(batasGaransiInput.current?.value || "1900-01-01"), new Date(tanggalAfkirInput.current?.value || "1900-01-01"));
        if (mode === "add")
          await aktivaMasterData.createAktivaMasterData();
        else if (mode === "edit")
          await aktivaMasterData.updateAktivaMasterData();

        showToast(`Aktiva data has been ${mode === "add" ? "created" : "updated"}.`);
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
            showToast("Entered Aktiva code was registered. Cannot create Aktiva data.");
            break;
          default: 
            showToast("An error has occured when creating / updating Aktiva data. If the problem persist, please contact ISW.");
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
    setSelectedHardwareMaster(mode === "add" ? "Select one" : aktivaMaster.hardwareCode.concat(" - ", hardwareMasterList.find(h => h.code === aktivaMaster.hardwareCode)?.descrption || ""));
  }, [hardwareMasterList]);

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
        ? <InputFieldLayout ref={aktivaCodeInput} label="Code" type="text" id="aktivaCode" placeholder="Enter Aktiva code" value="" errorText={aktivaCodeInputError} onInputChange={() => setAktivaCodeInputError("")} /> 
        : <div>
            <p className="text-sm text-gray-500">Aktiva Code</p>
            <p className="text-lg font-semibold text-red-500">{aktivaMaster.kodeAktiva}</p>
          </div>
      }
      <InputFieldLayout label="Hardware Type" type="select" id="hardwareTypeSelect" options={[...(hardwareMasterList.map((hardware) => `${hardware.code} - ${hardware.descrption}`)), " "]} value={selectedHardwareMaster} onSelectChange={setSelectedHardwareMaster} errorText={selectedHardwareMaster === "Select one" ? hardwareTypeInputError : ""} />
      <InputFieldLayout ref={aktivaDescInput} label="Description" type="text" id="aktivaMasterDesc" placeholder="Enter Aktiva Master description" value={aktivaMaster.descrption} errorText={aktivaDescInputError} onInputChange={() => setAktivaDescInputError("")} />
      <InputFieldLayout ref={merkInput} label="Brand" type="text" id="brandInput" placeholder="Enter Brand name" value={aktivaMaster.merk} />
      <InputFieldLayout ref={remarksInput} label="Remarks" type="textarea" id="remarksInput" placeholder="Enter remarks" value={aktivaMaster.remarks} />
      <InputFieldLayout ref={tanggalPembelianInput} label="Purchase Date" type="date" id="purchaseDateInput" value={`${aktivaMaster.tanggalPembelian.getFullYear()}-${(aktivaMaster.tanggalPembelian.getMonth() + 1).toString().padStart(2, "0")}-${aktivaMaster.tanggalPembelian.getDate()}`} />
      <InputFieldLayout ref={batasGaransiInput} label="Guarantee Expired on" type="date" id="guaranteeExpiredDateInput" value={`${aktivaMaster.batasGaransi.getFullYear()}-${(aktivaMaster.batasGaransi.getMonth() + 1).toString().padStart(2, "0")}-${aktivaMaster.batasGaransi.getDate()}`} />
      <InputFieldLayout ref={tanggalAfkirInput} label="Reject Date" type="date" id="rejectDateInput" value={`${aktivaMaster.tanggalAfkir.getFullYear()}-${(aktivaMaster.tanggalAfkir.getMonth() + 1).toString().padStart(2, "0")}-${aktivaMaster.tanggalAfkir.getDate()}`} />
      
      <ButtonLayout ref={btnSubmit} text={mode === "add" ? "Create" : "Update"} type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={submit} />
    </div>
  );
};
*/
