import { faArrowRight, faEquals, faExclamation, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonLayout } from "../common/ButtonLayout";
import HelpdeskHeader from "../../models/helpdesk/HelpdeskHeader";

export function HelpdeskHeaderLayout({ helpdesk }: { helpdesk:HelpdeskHeader }) {
  const drawer = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMaxHeight, setDrawerMaxHeight] = useState("0px");
  const navigate = useNavigate();

  useEffect(() => {
    setDrawerMaxHeight(drawer.current && drawerOpen ? `${drawer.current.scrollHeight}px` : "0px");
  }, [drawerOpen]);

  return (
    <div className={`relative flex flex-col space-y-2 px-3 py-2 ${helpdesk.notified && "bg-red-50"} border-2 rounded-lg shadow-lg shadow-gray-200 text-sm cursor-pointer ${helpdesk.status === "DONE" ? "border-green-700" : helpdesk.status === "UNPUBLISHED" ? "border-l-gray-500 border-t-gray-500" : helpdesk.status === "PUBLISHED" ? "border-l-blue-500 border-t-blue-500" : helpdesk.status === "REJECTED" ? "border-red-500" : helpdesk.status === "REVISION" ? "border-l-yellow-500 border-t-yellow-500" : "border-black"} ${helpdesk.status === "DONE" || helpdesk.status === "REJECTED" ? "" : helpdesk.prioritas === "Normal" ? "border-r-gray-500 border-b-gray-500" : helpdesk.prioritas === "Penting" ? "border-r-yellow-500 border-b-yellow-500" : helpdesk.prioritas === "Mendesak" ? "border-r-red-500 border-b-red-500" : "border-black"} hover:bg-blue-50`} onClick={() => { setDrawerOpen(!drawerOpen) }} onDoubleClick={() => navigate(`/helpdesk/info/${helpdesk.nomor}`)}>
      <div className={`${!helpdesk.notified && "hidden"} absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full`}></div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-5 items-center">
          <h1 className="font-semibold">{helpdesk.nomor}</h1>
          <p className={`text-xs px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${helpdesk.status === "DONE" ? "bg-green-800" : helpdesk.status === "UNPUBLISHED" ? "bg-gray-500" : helpdesk.status === "PUBLISHED" ? "bg-blue-500" : helpdesk.status === "REJECTED" ? "bg-red-400" : helpdesk.status === "REVISION" ? "bg-yellow-500" : "bg-black"}`}>
            {helpdesk.status}
          </p>
        </div>
        <p className="text-xs text-gray-500">{formatInTimeZone(helpdesk.tanggalTerbit, "Asia/Jakarta", "EEEE, d MMMM yyyy HH:mm:ss")}</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <p className="text-xs">{helpdesk.dari}</p>
        <span><FontAwesomeIcon icon={faArrowRight} /></span>
        <p className="text-xs">{helpdesk.kepada}</p>
      </div>

      <div className="flex justify-between space-x-5">
        <p className="grow self-center line-clamp-2">{helpdesk.title}</p>
        <div className={`flex self-start space-x-2 px-2 py-0.5 border rounded font-semibold ${helpdesk.prioritas === "Normal" ? "border-gray-600 text-gray-600" : helpdesk.prioritas === "Penting" ? "border-yellow-500 text-yellow-500" : "border-red-400 text-red-400"} text-sm`}>
          <span><FontAwesomeIcon icon={helpdesk.prioritas === "Normal" ? faEquals : helpdesk.prioritas === "Penting" ? faExclamation : faExclamationTriangle} /></span>
          <p>{helpdesk.prioritas}</p>
        </div>
      </div>

      <div ref={drawer} className={`transition-all duration-300 ease-in-out overflow-hidden ${drawerOpen ? "opacity-100" : "opacity-0"}`} style={{ maxHeight: drawerMaxHeight }}>
        <div className="flex justify-between items-center gap-5 py-1">
          <p className="text-xs text-justify">{helpdesk.progress}</p>
          <div className="shrink-0 text-xs">
            <ButtonLayout text="Open Details" type="text" colorClass="blue-500" onClick={() => navigate(`/helpdesk/info/${helpdesk.nomor}`)} />
          </div>
        </div>
      </div>
    </div>
  );
};
