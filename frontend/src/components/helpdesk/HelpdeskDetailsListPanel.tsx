import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Fieldset, Legend } from "@headlessui/react";
import { formatInTimeZone } from "date-fns-tz";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { HelpdeskDetailsLayout } from "./HelpdeskDetailsLayout";
import { UpdateAllJobRegistrationDialog } from "./UpdateAllJobRegistrationDialog";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import AktivaMaster from "../../models/master/AktivaMaster";
import HelpdeskDetails from "../../models/helpdesk/HelpdeskDetails";
import OrderMaster from "../../models/master/OrderMaster";
import emptyBox from "../../assets/empty-box.svg";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import HelpdeskNoteJobReg from "../../models/helpdesk/HelpdeskNoteJobReg";

export type HelpdeskDetailsListPanelRef = {
  validateDetailsListData: () => boolean;
  retrieveDetailsListData: () => HelpdeskDetails[];
};

type HelpdeskDetailsListPanelProps = {
  context: string;
  currentRole: string;
  nomor: string;
  kepada: string;
  existingDetailsList: HelpdeskDetails[];
  orderMasterList: OrderMaster[];
  aktivaMasterList: AktivaMaster[];
  setTemporaryJobRegStatus: Function;
  isMobileSize: boolean;
  showToast: (message: string) => void;
};

const HelpdeskDetailsListPanel = forwardRef<HelpdeskDetailsListPanelRef, HelpdeskDetailsListPanelProps>(({ context, currentRole, existingDetailsList, orderMasterList, aktivaMasterList, setTemporaryJobRegStatus, isMobileSize, showToast }: HelpdeskDetailsListPanelProps, ref) => {
  const auth = useAuth();
  const shortDateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "dd/MM/yyyy");
  const [comparableExistingDetailsList, setComparableExistingDetailsList] = useState<HelpdeskDetails[]>([]);
  const [detailsList, setDetailsList] = useState<HelpdeskDetails[]>([]);
  const [remarksList, setRemarksList] = useState<string[]>([]);
  const [detailsActiveLinenum, setDetailsActiveLinenum] = useState(-1);

  const [selectedOrderMaster, setSelectedOrderMaster] = useState("Select one Order Helpdesk");
  const [selectedNoAktiva, setSelectedNoAktiva] = useState("Select one aktiva code (optional)");
  const keteranganDetailsInput = useRef<HTMLInputElement>(null);
  const jumlahDetailsInput = useRef<HTMLInputElement>(null);
  
  const [orderMasterInputError, setOrderMasterInputError] = useState("");
  const [keteranganDetailsInputError, setKeteranganDetailsInputError] = useState("");
  const [jumlahDetailsInputError, setJumlahDetailsInputError] = useState("");

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = useState("");
  const [confirmationDialogMessage, setConfirmationDialogMessage] = useState("");

  const [jobRegIndexToBeSplitted, setJobRegIndexToBeSplitted] = useState(-1);
  const [updateAllJobRegDialogOpen, setUpdateAllJobRegDialogOpen] = useState(false);

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
    if (keteranganDetailsInput.current && jumlahDetailsInput.current) {
      if (selectedOrderMaster === "Select one Order Helpdesk" || keteranganDetailsInput.current.value.length <= 0 || jumlahDetailsInput.current.value.length <= 0) {
        showToast("Cannot add / update job registration. Data is incomplete.");

        setOrderMasterInputError(selectedOrderMaster === "Select one Order Helpdesk" ? "Order helpdesk not selected." : "");
        setKeteranganDetailsInputError(keteranganDetailsInput.current.value.length <= 0 ? "Details is empty." : "");
        setJumlahDetailsInputError(jumlahDetailsInput.current.value.length <= 0 ? "Amount is empty." : "");
        return;
      } else if (!checkText(keteranganDetailsInput.current.value)) {
        showToast("Please kindly recheck the entered text.");
        setKeteranganDetailsInputError("Please kindly recheck the entered text.");
        return;
      }

      const selectedOrder = orderMasterList.find(order => order.descrption === selectedOrderMaster);
      const selectedAktiva = (selectedNoAktiva !== "Select one aktiva code (optional)" ? selectedNoAktiva : "");
      if (detailsActiveLinenum === -1) {
        const newDetailsList = [...detailsList];
        newDetailsList.push(new HelpdeskDetails(detailsList.length, selectedOrder?.code || "", Number(jumlahDetailsInput.current.value), keteranganDetailsInput.current.value, "WAITING", selectedAktiva));
        setDetailsList(newDetailsList);
        setRemarksList(prev => [...prev, ""]);
      } else {
        setDetailsList(prev => prev.map(details => details.linenum === detailsActiveLinenum ? new HelpdeskDetails(detailsActiveLinenum, selectedOrder?.code || "", Number(jumlahDetailsInput.current!.value), keteranganDetailsInput.current!.value, "WAITING", selectedAktiva, details.pic, details.tanggalTerima, details.ts, details.tanggalSelesai) : details));
      }

      setOrderMasterInputError("");
      setSelectedOrderMaster("Select one Order Helpdesk");
      jumlahDetailsInput.current.value = "";
      keteranganDetailsInput.current.value = "";
      setSelectedNoAktiva("Select one aktiva code (optional)");
      setDetailsActiveLinenum(-1);
    }
  };

  const cancelEdit = () => {
    setOrderMasterInputError("");
    setSelectedOrderMaster("Select one Order Helpdesk");
    jumlahDetailsInput.current!.value = "";
    keteranganDetailsInput.current!.value = "";
    setSelectedNoAktiva("Select one aktiva code (optional)");
    setDetailsActiveLinenum(-1);
  };

  const updateDetails = (linenum: number, details: HelpdeskDetails) => {
    const oldDetails = comparableExistingDetailsList.find(details => details.linenum === linenum)!;
    if (details.pic !== oldDetails.pic && details.ts !== oldDetails.ts)
      details.tanggalTerima = new Date();
    else if (details.status === "DONE" && oldDetails.status === "WAITING")
      details.tanggalSelesai = new Date();
    else if (details.status === "WAITING")
      details.tanggalSelesai = oldDetails.tanggalSelesai;
    
    setDetailsList(prev => prev.map(d => d.linenum === linenum ? details : d));
  };

  const updateAllDetails = (pic: string, ts: Date, status: string) => {
    detailsList.forEach(details => {
      if (details.pic.length <= 0 && details.ts.getFullYear() === 1900) {
        const newDetails = new HelpdeskDetails(details.linenum, details.order, details.jumlah, details.keterangan, status, details.noAktiva, pic, details.tanggalTerima, ts, details.tanggalSelesai);
        updateDetails(details.linenum, newDetails);
      }
    });
  };

  const updateRemarks = (linenum: number, remarks: string) => {
    setRemarksList(prev => prev.map((oldRemarks, index) => index === detailsList.indexOf(detailsList.find(details => details.linenum === linenum)!) ? remarks : oldRemarks));
  };

  const splitDetails = (linenum: number) => {
    const newDetails = new HelpdeskDetails(linenum + 1, detailsList[linenum].order, detailsList[linenum].jumlah, detailsList[linenum].keterangan, "WAITING", detailsList[linenum].noAktiva);
    const newComparableDetails = new HelpdeskDetails(linenum + 1, detailsList[linenum].order, detailsList[linenum].jumlah, detailsList[linenum].keterangan, "WAITING", detailsList[linenum].noAktiva);

    const updatedDetailsList = [...detailsList.slice(0, linenum + 1), newDetails, ...detailsList.slice(linenum + 1)];
    updatedDetailsList.forEach((details, index) => details.linenum = index);

    const updatedComparableDetailsList = [...comparableExistingDetailsList.slice(0, linenum + 1), newComparableDetails, ...comparableExistingDetailsList.slice(linenum + 1)];
    updatedComparableDetailsList.forEach((details, index) => details.linenum = index);

    setDetailsList(updatedDetailsList);
    setComparableExistingDetailsList(updatedComparableDetailsList);
    setRemarksList([...remarksList.slice(0, linenum + 1), "", ...remarksList.slice(linenum + 1)]);
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
    setRemarksList([...remarksList.slice(0, linenum), ...remarksList.slice(linenum + 1)]);
  };

  const confirmSplitJobReg = (linenum: number) => {
    setJobRegIndexToBeSplitted(linenum);
    setConfirmationDialogTitle("Split Job Registration");
    setConfirmationDialogMessage("Confirm to split job registration? This action is irreversible (splitted job registration cannot be removed)");
    setConfirmationDialogOpen(true);
  };

  const confirmationDialogResponse = async (res: boolean) => {
    if (res)
      splitDetails(jobRegIndexToBeSplitted)
    setJobRegIndexToBeSplitted(-1);
  };

  useEffect(() => {
    if (detailsActiveLinenum >= 0 && ["create", "revision"].includes(context)) {
      const details = detailsList[detailsActiveLinenum];
      setSelectedOrderMaster(`${orderMasterList.find(order => order.code === details.order)?.descrption}`);
      keteranganDetailsInput.current!.value = details.keterangan;
      jumlahDetailsInput.current!.value = details.jumlah.toString();
      setSelectedNoAktiva(details.noAktiva.length <= 0 ? "Select one aktiva code (optional)" : details.noAktiva);
    } 
  }, [detailsActiveLinenum]);

  useEffect(() => {
    setTemporaryJobRegStatus(detailsList.map(details => details.status));
  }, [detailsList]);

  useEffect(() => {
    setDetailsList([...existingDetailsList]);
    setComparableExistingDetailsList([...existingDetailsList]);
    setRemarksList(existingDetailsList.map(_ => ""));
  }, [existingDetailsList])

  useImperativeHandle(ref, () => ({
    validateDetailsListData: () => {
      if (detailsList.length <= 0) {
        showToast("At least one job registration should be added on helpdesk creation. Cannot create / update helpdesk.");
        return false;
      } else if (remarksList.find(remarks => !checkText(remarks))) {
        showToast("Please kindly recheck the entered text on job registration details.");
        return false;
      } else if (detailsList.find(details => (details.pic.length > 0 && details.ts.getFullYear() === 1900) || (details.ts.getFullYear() !== 1900 && details.pic.length <= 0))) {
        showToast("PIC or TS is empty. Cannot update job registration.");
        return false;
      }
      return true;
    },
    retrieveDetailsListData: () => {
      const updatedDetailsList = [...detailsList];
      updatedDetailsList.forEach((details, index) => {
        if (remarksList[index].length > 0)
          details.noteList.push(new HelpdeskNoteJobReg(details.noteList.length, new Date(), auth.scope?.username, remarksList[index]));

        const currentDetails = comparableExistingDetailsList.find(d => d.linenum === details.linenum);
        if (details.pic.length > 0 && details.pic !== currentDetails?.pic)
          details.noteList.push(new HelpdeskNoteJobReg(details.noteList.length, new Date(), "system", `PIC of this Job Registration was ${(currentDetails?.pic.length || 0) <= 0 ? "set" : "changed"} to ${details.pic}${(currentDetails?.pic.length || 0) <= 0 ? "" : (" from " + currentDetails?.pic)}`));

        if (details.ts.getFullYear() !== 1900 && details.ts.getTime() !== currentDetails?.ts.getTime())
          details.noteList.push(new HelpdeskNoteJobReg(details.noteList.length, new Date(), "system", `TS of this Job Registration was ${(currentDetails?.ts.getFullYear() || 0) === 1900 ? "set" : "changed"} to ${shortDateFormatter(details.ts)}${(currentDetails?.ts.getFullYear() || 0) === 1900 ? "" : (" from " + shortDateFormatter(currentDetails?.ts || new Date()))}`));

        if (details.status !== currentDetails?.status && (currentDetails?.status.length || 0) > 0)
          details.noteList.push(new HelpdeskNoteJobReg(details.noteList.length, new Date(), "system", `Status of this Job Registration was changed from ${currentDetails?.status || ""} to ${details.status}`));
      });
      return updatedDetailsList;
    }
  }));

  return (
    <Fieldset className="flex flex-col grow-1 gap-3 p-5 border-1 border-gray-300 rounded-md shadow-md md:max-h-1/2 md:overflow-clip">
      {
        !["create","revision"].includes(context) ?
        (
          <div className="h-full flex gap-5 overflow-hidden">
            <div className="grow-1 space-y-3 md:basis-1/2 md:grow-0 md:shrink-0">
              <div className="flex justify-between items-center">
                <p className="font-semibold">Job Registration List</p>
                <div className={`w-32 ml-auto text-sm ${!(context === "recipientFeedback" && currentRole === "recipient" && detailsList.find(details => details.pic.length <= 0 && details.ts.getFullYear() === 1900)) && "hidden"}`}>
                  <ButtonLayout text="Update Many..." type="outline" colorClass="green-700" onClick={() => setUpdateAllJobRegDialogOpen(true)} />
                </div>
              </div>
              {
                detailsList.map(details => <HelpdeskDetailsLayout key={details.linenum} details={details} remarks={remarksList[details.linenum]} orderMasterList={orderMasterList} aktivaMasterList={aktivaMasterList} view="summary" selectDetails={setDetailsActiveLinenum} removeDetails={removeDetails} selected={details.linenum === detailsActiveLinenum} />)
              }
            </div>
            {
              detailsActiveLinenum === -1 ?
              (
                isMobileSize ? <></> :
                <div className="h-full flex flex-col space-y-3 my-auto md:basis-1/2">
                  <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
                  <p className="self-center text-sm text-center">Select one Job Registration from the list to show the details here.</p>
                </div>
              ) :
              (
                isMobileSize ?
                <Dialog open={detailsActiveLinenum >= 0} className="relative z-10 focus:outline-none" onClose={() => {}}>
                  <DialogBackdrop transition className="fixed inset-0 bg-black/30 duration-100 ease-out data-[closed]:opacity-0" />
                  <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center">
                      <DialogPanel transition className="w-full max-w-md rounded-xl py-3 bg-white backdrop-blur-2xl duration-100 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
                        <DialogTitle className="text-base/7 font-medium mx-3 px-2">
                          <div className="flex justify-between">
                            <p className="text-lg font-semibold text-red-500">Details</p>
                            <CloseButton as={Button}><span className="text-red-400 cursor-pointer" onClick={() => setDetailsActiveLinenum(-1)}><FontAwesomeIcon icon={faClose}/></span></CloseButton>
                          </div>
                        </DialogTitle>
                        <hr className="mt-3 mx-2 border-t-2 border-t-red-200" />
                        <div className="flex flex-col grow-1 space-y-2 p-5">
                          <HelpdeskDetailsLayout details={detailsList.find(details => details.linenum === detailsActiveLinenum)!} remarks={remarksList[detailsList.indexOf(detailsList.find(details => details.linenum === detailsActiveLinenum)!)]} orderMasterList={orderMasterList} aktivaMasterList={aktivaMasterList} view="details" setDetails={updateDetails} setRemarks={updateRemarks} splitDetails={confirmSplitJobReg} canUpdateJobReg={context === "recipientFeedback" && currentRole === "recipient"} canUpdateStatus={context === "recipientFeedback" && ["recipient", "recipientPic"].includes(currentRole)} canSplit={context === "recipientFeedback" && currentRole === "recipient"} />
                        </div>
                      </DialogPanel>
                    </div>
                  </div>
                </Dialog> :
                <div className="h-full flex flex-col grow-1 space-y-2 p-5 border border-gray-300 rounded-md shadow-md overflow-auto">
                  <HelpdeskDetailsLayout details={detailsList.find(details => details.linenum === detailsActiveLinenum)!} remarks={remarksList[detailsList.indexOf(detailsList.find(details => details.linenum === detailsActiveLinenum)!)]} orderMasterList={orderMasterList} aktivaMasterList={aktivaMasterList} view="details" setDetails={updateDetails} setRemarks={updateRemarks} splitDetails={confirmSplitJobReg} canUpdateJobReg={context === "recipientFeedback" && currentRole === "recipient"} canUpdateStatus={context === "recipientFeedback" && ["recipient", "recipientPic"].includes(currentRole)} canSplit={context === "recipientFeedback" && currentRole === "recipient"} />
                </div>
              )
            }
            <UpdateAllJobRegistrationDialog open={updateAllJobRegDialogOpen} closeDialog={() => setUpdateAllJobRegDialogOpen(false)} updateAllJobReg={updateAllDetails} showToast={showToast} />
          </div>
        ) :
        (
          <>
            <Legend className="font-semibold">Job Registration</Legend>
            <div className="w-full flex flex-col space-y-5 md:flex-row md:space-x-5">
              <div className="flex flex-col space-y-3 basis-1/2">
                <InputFieldLayout label="Order Type" type="select" id="dropdownJenisPermintaan" placeholder="Select order type" value={selectedOrderMaster} options={orderMasterList.map(order => `${order.descrption}`)} errorText={selectedOrderMaster === "Select one Order Helpdesk" ? orderMasterInputError : ""} onSelectChange={setSelectedOrderMaster} />
                <InputFieldLayout ref={keteranganDetailsInput} label="Details" type="textarea" id="txtBoxKeterangan" placeholder="Enter job registration details" errorText={keteranganDetailsInputError} onInputChange={() => setKeteranganDetailsInputError("")}  />
                <InputFieldLayout ref={jumlahDetailsInput} label="Amount" type="number" id="txtBoxJumlah" placeholder="Enter amount" errorText={jumlahDetailsInputError} onInputChange={() => setJumlahDetailsInputError("")} />
                <InputFieldLayout label="No. Aktiva" type="select" id="selectNoAktiva" options={["Select one aktiva code (optional)", ...aktivaMasterList.map(aktiva => `${aktiva.kodeAktiva} - ${aktiva.descrption}`)]} value={selectedNoAktiva} onSelectChange={setSelectedNoAktiva} />
                <div className={`${detailsActiveLinenum === -1 || (detailsList[detailsActiveLinenum].status === "WAITING") ? "flex" : "hidden" } items-center gap-5 self-end text-xs`}>
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
                    : detailsList.map(details => <HelpdeskDetailsLayout key={details.linenum} details={details} remarks={remarksList[details.linenum]} orderMasterList={orderMasterList} aktivaMasterList={aktivaMasterList} view="summary" selectDetails={setDetailsActiveLinenum} removeDetails={removeDetails} selected={details.linenum === detailsActiveLinenum} canEditAndDelete={details.status === "WAITING"} />)
                  }
                </div>
              </div>
            </div>
          </>
        )
      }
      <ConfirmationDialog open={confirmationDialogOpen} closeDialog={() => setConfirmationDialogOpen(false)} title={confirmationDialogTitle} message={confirmationDialogMessage} confirmationButton="ConfirmCancel" setResponse={confirmationDialogResponse} />
    </Fieldset>
  );
});

export default HelpdeskDetailsListPanel;
