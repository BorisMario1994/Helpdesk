import { Switch } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import AktivaMaster from "../../models/master/AktivaMaster";
import HelpdeskDetails from "../../models/helpdesk/HelpdeskDetails";
import OrderMaster from "../../models/master/OrderMaster";
import { formatInTimeZone } from "date-fns-tz";

type HelpdeskDetailsLayoutProps = {
  details: HelpdeskDetails;
  remarks: string;
  orderMasterList: OrderMaster[];
  aktivaMasterList: AktivaMaster[];
  view: string;
  selectDetails?: (linenum: number) => void;
  setDetails?: (linenum: number, details: HelpdeskDetails) => void;
  setRemarks?: (linenum: number, remarks: string) => void;
  splitDetails?: (linenum: number) => void;
  removeDetails?: (linenum: number) => void;
  selected?: boolean;
  canUpdateStatus?: boolean;
  canUpdateJobReg?: boolean;
  canSplit?: boolean;
  canEditAndDelete?: boolean;
};

export function HelpdeskDetailsLayout({ details, remarks = "", orderMasterList, aktivaMasterList, view = "summary", selectDetails = (_: number) => {  }, setDetails = (_: number, __: HelpdeskDetails) => {  }, setRemarks = (_: number, __: string) => {  }, splitDetails = (_: number) => {  }, removeDetails = (_: number) => {  }, selected = false, canUpdateStatus = false, canUpdateJobReg = false, canSplit = false, canEditAndDelete = false}: HelpdeskDetailsLayoutProps) {
  const auth = useAuth();
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "EEEE, d MMMM yyyy HH:mm:ss");
  const shortDateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
  
  const remarksInput = useRef<HTMLInputElement>(null);
  const tsDateInput = useRef<HTMLInputElement>(null);
  const noteContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPic, setSelectedPic] = useState(details.pic);
  const [selectedNoAktiva, setSelectedNoAktiva] = useState(details.noAktiva.length > 0 ? details.noAktiva : "Select one aktiva code (optional)");
  const [statusIsDone, setStatusIsDone] = useState(details.status === "DONE");

  const updateDetails = () => {
    const selectedAktiva = (selectedNoAktiva !== "Select one aktiva code (optional)" ? selectedNoAktiva : "");
    const updatedDetails = new HelpdeskDetails(details.linenum, details.order, details.jumlah, details.keterangan, statusIsDone ? "DONE" : "WAITING", selectedAktiva, selectedPic, details.tanggalTerima, new Date(tsDateInput.current?.value || details.ts), details.tanggalSelesai);
    updatedDetails.noteList.push(...details.noteList);
    setDetails(details.linenum, updatedDetails);
  }

  const updateRemarks = () => {
    setRemarks(details.linenum, remarksInput.current?.value || "");
  }

  useEffect(() => {
    // Wait for layout to complete, then scroll
    const timeout = setTimeout(() => {
      noteContainerRef.current?.scrollTo({ top: noteContainerRef.current.scrollHeight, left: 0, behavior: "smooth" });
    }, 0);

    return () => clearTimeout(timeout);
  }, [details.noteList]); // Run this whenever messages change

  useEffect(() => {
    if (remarksInput.current)
      remarksInput.current.value = remarks;
    if (tsDateInput.current)
      tsDateInput.current.value = details.ts.getFullYear() === 1900 ? "dd/MM/yyyy" : `${details.ts.getFullYear()}-${(details.ts.getMonth() + 1).toString().padStart(2, "0")}-${details.ts.getDate().toString().padStart(2, "0")}`;
    setSelectedPic(details.pic);
    setStatusIsDone(details.status === "DONE");
  }, [details]);

  useEffect(() => {
    updateDetails();
  }, [selectedPic, selectedNoAktiva, statusIsDone]);

  return view === "details" ?
  (
    <>
      <div className="flex justify-between">
        <pre className="font-bold">{orderMasterList.find(order => order.code === details.order)?.descrption}</pre>
        <div className="flex items-center gap-2">
          <p className={`text-xs px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${details.status === "DONE" ? "bg-green-700" : "bg-yellow-500"}`}>
            {details.status}
          </p>
          <p className="text-xs text-gray-500 italic">Jumlah : <span className="text-black">{details.jumlah}</span></p>
        </div>
      </div>
      <pre className="text-sm text-wrap select-text">{details.keterangan}</pre>
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-500">Remarks</p>
        <div ref={noteContainerRef} className="max-h-72 flex flex-col gap-2 p-2 border border-gray-300 rounded-lg text-xs overflow-auto select-text">
          {
            details.noteList.length <= 0 ? 
            <p>No remarks yet.</p> : 
            details.noteList.map((note, index) => 
              note.username === "system" ?
              <p key={index} className="my-2 shrink-0 mt-1 text-center font-semibold">{note.comment.concat(` on ${shortDateFormatter(note.tanggal)}`)}</p>
              :
              <div key={index} className="flex flex-col items-start gap-1">
                <p className="shrink-0 mt-1 font-semibold">{`${note.username} (${shortDateFormatter(note.tanggal)}):`}</p>
                <pre className="px-3 py-1 border border-gray-400 rounded-full">{note.comment}</pre>
              </div>
            )
          }
        </div>
        <InputFieldLayout ref={remarksInput} type="textarea" id="remarksInput" label={`${auth.scope?.username} (${formatInTimeZone(new Date(), "Asia/Jakarta", "dd/MM/yyyy")}):`} placeholder="Type remarks for PIC here..." value={remarks} onInputChange={() => updateRemarks()} additionalClass={`${!canUpdateStatus && "hidden"}`} />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">PIC</p>
        <p className={`${canUpdateJobReg && "hidden"} text-sm font-semibold`}>{details.pic.length > 0 ? details.pic : "-"}</p>
        <InputFieldLayout id="selectPic" type="select" options={[auth.scope?.username || "", ...(auth.scope?.inferior || [])]} value={selectedPic} onSelectChange={setSelectedPic} additionalClass={`${!canUpdateJobReg && "hidden"} w-32`} />
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">Received Date</p>
        <p className="text-sm">{details.tanggalTerima.getFullYear() === 1900 ? "-" : dateFormatter(details.tanggalTerima)}</p>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">TS</p>
        <p className={`${canUpdateJobReg && "hidden"} text-sm`}>{details.ts.getFullYear() === 1900 ? "-" : formatInTimeZone(details.ts, "Asia/Jakarta", "EEEE, d MMMM yyyy")}</p>

        <InputFieldLayout ref={tsDateInput} id="tsDateInput" type="date" onInputChange={() => updateDetails()} minDate={new Date().toISOString().split("T")[0]} additionalClass={`${!canUpdateJobReg && "hidden"} w-32`} />
      </div>
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">Finished Date</p>
        <p className="text-sm">{details.tanggalSelesai.getFullYear() === 1900 ? "-" : dateFormatter(details.tanggalSelesai)}</p>
      </div>
      <div className={`${!canUpdateStatus && "hidden"} flex justify-between items-center`}>
        <p className="text-sm text-gray-500">Change Status</p>
        <div className="flex gap-3">
          <p className={`text-sm ${statusIsDone ? "text-green-700" : "text-yellow-500"} font-semibold`}>{statusIsDone ? "DONE" : "WAITING"}</p>
          <Switch checked={statusIsDone} onChange={setStatusIsDone} className="group h-5 w-9 inline-flex items-center rounded-full bg-yellow-500 transition data-checked:bg-green-700">
            <span className="size-3 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-5" />
          </Switch>
        </div>
      </div>
      <div>
        <div className={`flex justify-between ${canUpdateStatus && "hidden"}`}>
          <p className="text-sm text-gray-500">No. Aktiva</p>
          <p className={`text-sm ${canUpdateStatus && "hidden"}`}>{details.noAktiva.length <= 0 ? "-" : details.noAktiva}</p>
        </div>
        <InputFieldLayout label="No. Aktiva" type="select" id="selectNoAktiva" options={aktivaMasterList.map(aktiva => `${aktiva.kodeAktiva} - ${aktiva.descrption}`)} value={selectedNoAktiva} onSelectChange={setSelectedNoAktiva} additionalClass={`${!canUpdateStatus && "hidden"}`} />
      </div>
      
      <div className={`w-24 text-sm ${!canSplit && "hidden"}`}>
        <ButtonLayout text="Split" type="outline" colorClass="yellow-500" onClick={() => splitDetails(details.linenum)} />
      </div>
    </>
  ) :
  (
    <div className={`flex flex-col p-2 border border-gray-400 rounded-md ${selected && "bg-blue-100"} cursor-pointer`} onClick={() => { if (!canEditAndDelete) selectDetails(details.linenum); }}>
      <div className="flex justify-between text-sm">
        <p className="font-bold">{orderMasterList.find(order => order.code === details.order)?.descrption}</p>
        <div className="flex items-center gap-2">
          <p className={`text-xs px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${details.status === "DONE" ? "bg-green-700" : "bg-yellow-500"} ${canEditAndDelete && "hidden"}`}>
            {details.status}
          </p>
          <p className="text-xs text-gray-500 italic">Amount : <span className="text-black">{details.jumlah}</span></p>
        </div>
      </div>
      <pre className="mt-1 text-sm text-wrap line-clamp-2 overflow-ellipsis">{details.keterangan}</pre>
      <div className={`flex gap-5 shrink-0 self-end text-sm ${!canEditAndDelete && "hidden"}`}>
        <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={() => removeDetails(details.linenum)} />
        <ButtonLayout text="Edit" type="text" colorClass="yellow-500" onClick={() => selectDetails(details.linenum)} />
      </div>
    </div>
  );
};
