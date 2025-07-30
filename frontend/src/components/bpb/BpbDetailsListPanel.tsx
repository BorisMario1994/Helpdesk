import { Fieldset, Legend } from "@headlessui/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import emptyBox from "../../assets/empty-box.svg";
import BpbDetails from "../../models/bpb/BpbDetails";
import { BpbDetailsLayout } from "./BpbDetailsLayout";

export type BpbDetailsListPanelRef = {
  validateDetailsListData: () => boolean;
  retrieveDetailsListData: () => BpbDetails[];
};

type BpbDetailsListPanelProps = {
  context: string;
  existingDetailsList: BpbDetails[];
  showToast: (message: string) => void;
};

const BpbDetailsListPanel = forwardRef<BpbDetailsListPanelRef, BpbDetailsListPanelProps>(({ context, existingDetailsList, showToast }: BpbDetailsListPanelProps, ref) => {
  const [detailsList, setDetailsList] = useState<BpbDetails[]>([]);
  const [detailsActiveLinenum, setDetailsActiveLinenum] = useState(-1);

  const nameInput = useRef<HTMLInputElement>(null);
  const qtyInput = useRef<HTMLInputElement>(null);
  const uomInput = useRef<HTMLInputElement>(null);
  const tsInput = useRef<HTMLInputElement>(null);
  const [selectedReturnRequired, setSelectedReturnRequired] = useState("Select one");
  
  const [nameInputError, setNameInputError] = useState("");
  const [qtyInputError, setQtyInputError] = useState("");
  const [uomInputError, setUomInputError] = useState("");
  const [returnRequiredInputError, setReturnRequiredInputError] = useState("");
  const [tsInputError, setTsInputError] = useState("");

  const checkText = (text: string) => {
    const prohibitedText = [" COP ", " HOP ", " SEROJA ", " LUMINA ", " KAS I ", " KAS-I "];
    let valid = true;
    prohibitedText.forEach(txt => {
      if (text.toUpperCase().indexOf(txt) > -1){
        valid = false;
        return;
      }
    });
    return valid;
  };

  const addOrEditDetails = () => {
    if (nameInput.current && qtyInput.current && uomInput.current && tsInput.current) {
      if (nameInput.current.value.length <= 0 || qtyInput.current.value.length <= 0 || uomInput.current.value.length <= 0 || selectedReturnRequired === "Select one" || (selectedReturnRequired === "Yes" && new Date(tsInput.current.value).toString() === "Invalid Date")) {
        showToast("Cannot add / update job registration. Data is incomplete.");

        setNameInputError(nameInput.current.value.length <= 0 ? "Item name is empty." : "");
        setQtyInputError(qtyInput.current.value.length <= 0 ? "Quantity is empty." : "");
        setUomInputError(uomInput.current.value.length <= 0 ? "UoM is empty." : "");
        setReturnRequiredInputError(selectedReturnRequired === "Select one" ? "Return Required option not selected." : "");
        setTsInputError((selectedReturnRequired === "Yes" && new Date(tsInput.current.value).toString() === "Invalid Date") ? "Return TS date is invalid." : "");
        return;
      } else if (!checkText(nameInput.current.value)) {
        showToast("Please kindly recheck the entered text.");
        setNameInputError("Please kindly recheck the entered text.");
        return;
      }

      if (detailsActiveLinenum === -1) {
        const newDetailsList = [...detailsList];
        newDetailsList.push(new BpbDetails(detailsList.length, Number(qtyInput.current.value), uomInput.current.value, nameInput.current.value, selectedReturnRequired.substring(0, 1), selectedReturnRequired === "Yes" ? new Date(tsInput.current.value) : new Date("1900-01-01")));
        setDetailsList(newDetailsList);
      } else {
        setDetailsList(prev => prev.map(details => details.linenum === detailsActiveLinenum ? new BpbDetails(detailsActiveLinenum, Number(qtyInput.current!.value), uomInput.current!.value, nameInput.current!.value, selectedReturnRequired.substring(0, 1), selectedReturnRequired === "Yes" ? new Date(tsInput.current!.value) : new Date("1900-01-01")) : details));
      }

      nameInput.current.value = "";
      qtyInput.current.value = "";
      uomInput.current.value = "";
      setSelectedReturnRequired("Select one");
      tsInput.current.value = "dd/MM/yyyy"
      setReturnRequiredInputError("");
      setDetailsActiveLinenum(-1);
    }
  };

  const cancelEdit = () => {
    nameInput.current!.value = "";
    qtyInput.current!.value = "";
    uomInput.current!.value = "";
    setSelectedReturnRequired("Select one");
    tsInput.current!.value = "dd/MM/yyyy"
    setReturnRequiredInputError("");
    setDetailsActiveLinenum(-1);
  };

  const removeDetails = (linenum: number) => {
    if (detailsActiveLinenum === linenum)
      cancelEdit();
    else if (detailsActiveLinenum > linenum)
      setDetailsActiveLinenum(detailsActiveLinenum - 1);
    const newDetailsList = [...detailsList.slice(0, linenum), ...detailsList.slice(linenum + 1)];
    newDetailsList.forEach((details, index = 0) => {
      details.linenum = index;
    });
    setDetailsList(newDetailsList);
  };

  useEffect(() => {
    if (detailsActiveLinenum >= 0 && ["create", "revision"].includes(context)) {
      const details = detailsList[detailsActiveLinenum];
      nameInput.current!.value = details.nama;
      qtyInput.current!.value = details.qty.toString();
      uomInput.current!.value = details.satuan;
      setSelectedReturnRequired(details.wajibKembali === "Y" ? "Yes" : "No");
      tsInput.current!.value = details.tsKembali.getFullYear() === 1900 ? "dd/MM/yyyy" : `${details.tsKembali.getFullYear()}-${(details.tsKembali.getMonth() + 1).toString().padStart(2, "0")}-${details.tsKembali.getDate().toString().padStart(2, "0")}`;
    } 
  }, [detailsActiveLinenum]);

  useEffect(() => {
    setDetailsList([...existingDetailsList]);
  }, [existingDetailsList])

  useImperativeHandle(ref, () => ({
    validateDetailsListData: () => {
      if (detailsList.length <= 0) {
        showToast("At least one job registration should be added on helpdesk creation. Cannot create / update helpdesk.");
        return false;
      } 
      return true;
    },
    retrieveDetailsListData: () => {
      return [...detailsList];
    }
  }));

  return !["create","revision"].includes(context) ?
  (
    <div className="grow-1 space-y-3 md:basis-1/2 md:grow-0 md:shrink-0">
      <p className="font-semibold">Job Registration List</p>
      {
        detailsList.map(details => <BpbDetailsLayout key={details.linenum} details={details} selectDetails={setDetailsActiveLinenum} removeDetails={removeDetails} selected={details.linenum === detailsActiveLinenum} />)
      }
    </div>
  ) : (
    <Fieldset className="flex flex-col grow-1 gap-3 p-5 border-1 border-gray-300 rounded-md shadow-md md:max-h-1/2 md:overflow-clip">
      <Legend className="font-semibold">Job Registration</Legend>
      <div className="w-full flex flex-col space-y-5 md:flex-row md:space-x-5">
        <div className="flex flex-col space-y-3 basis-1/2">
          <InputFieldLayout ref={nameInput} label="Item Name" type="text" id="txtBoxName" placeholder="Enter item name" errorText={nameInputError} onInputChange={() => setNameInputError("")} />
          <div className="flex space-x-5">
            <InputFieldLayout ref={qtyInput} label="Quantity" type="number" id="txtBoxQty" placeholder="Enter quantity" errorText={qtyInputError} onInputChange={() => setQtyInputError("")} additionalClass="basis-1/2" />
            <InputFieldLayout ref={uomInput} label="UoM (Unit of Measurement)" type="text" id="txtBoxUom" placeholder="Enter unit" errorText={uomInputError} onInputChange={() => setUomInputError("")} additionalClass="basis-1/2" />
          </div>
          <div className="flex space-x-5">
            <InputFieldLayout label="Return Required" type="select" id="dropdownReturnRequired" placeholder="Select one" value={selectedReturnRequired} options={["Yes", "No"]} errorText={selectedReturnRequired === "Select one" ? returnRequiredInputError : ""} onSelectChange={setSelectedReturnRequired} additionalClass="basis-1/2" />
            <InputFieldLayout ref={tsInput} label="Return TS" type="date" id="dtpReturnTs" errorText={tsInputError} onInputChange={() => setTsInputError("")} additionalClass="basis-1/2" />
          </div>
          <div className="flex items-center gap-5 self-end text-xs">
            <div className={detailsActiveLinenum === -1 ? "hidden" : "shrink-0"}>
              <ButtonLayout text="Cancel" type="text" colorClass="red-500" onClick={cancelEdit} />
            </div>
            <ButtonLayout text={detailsActiveLinenum === -1 ? "Add to List" : "Edit Details"} type="outline" colorClass="green-700" onClick={addOrEditDetails} />
          </div>
        </div>
        <div className="space-y-3 basis-1/2">
          <p className="text-sm font-semibold">Job Registration List</p>
          <div className="space-y-3">
            {
              detailsList.length <= 0 ?
              <div className="flex flex-col space-y-3 my-auto">
                <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
                <p className="self-center text-sm text-center">No job registration added for this helpdesk.</p>
              </div>
              : detailsList.map(details => <BpbDetailsLayout key={details.linenum} details={details} selectDetails={setDetailsActiveLinenum} removeDetails={removeDetails} selected={details.linenum === detailsActiveLinenum} canEditAndDelete={true} />)
            }
          </div>
        </div>
      </div>
    </Fieldset>
  );
});

export default BpbDetailsListPanel;
