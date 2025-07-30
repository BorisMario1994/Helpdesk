import { ButtonLayout } from "../common/ButtonLayout";
import { formatInTimeZone } from "date-fns-tz";
import BpbDetails from "../../models/bpb/BpbDetails";

type BpbDetailsLayoutProps = {
  details: BpbDetails;
  selectDetails?: (linenum: number) => void;
  removeDetails?: (linenum: number) => void;
  selected?: boolean;
  canEditAndDelete?: boolean;
};

export function BpbDetailsLayout({ details, selectDetails = (_: number) => {  }, removeDetails = (_: number) => {  }, selected = false, canEditAndDelete = false}: BpbDetailsLayoutProps) {
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "EEEE, d MMMM yyyy");

  return (
    <div className={`flex flex-col p-2 border border-gray-400 rounded-md ${selected && "bg-blue-100"} cursor-pointer`} onClick={() => { if (!canEditAndDelete) selectDetails(details.linenum); }}>
      <div className="flex justify-between text-sm">
        <p className="font-bold">{details.nama}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 italic">Quantity : <span className="text-black">{details.qty} {details.satuan}</span></p>
        </div>
      </div>
      <p className="mt-1 text-sm">{details.wajibKembali === "Y" ? "Return Required (Wajib Kembali)" : "Return Not Required (Tidak Wajib Kembali)"}</p>
      <div className={`flex justify-between mt-1 ${details.wajibKembali === "N" && "hidden"}`}>
        <p className="text-sm text-gray-500">TS Return Date</p>
        <p className="text-sm">{dateFormatter(details.tsKembali)}</p>
      </div>
      <div className={`flex gap-5 shrink-0 self-end text-sm ${!canEditAndDelete && "hidden"}`}>
        <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={() => removeDetails(details.linenum)} />
        <ButtonLayout text="Edit" type="text" colorClass="yellow-500" onClick={() => selectDetails(details.linenum)} />
      </div>
    </div>
  );
};
