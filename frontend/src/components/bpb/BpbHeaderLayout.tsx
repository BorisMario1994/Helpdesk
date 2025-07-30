import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResizeDetector } from "react-resize-detector";
import { ButtonLayout } from "../common/ButtonLayout";
import BpbHeader from "../../models/bpb/BpbHeader";

export function BpbHeaderLayout({ bpb, index, setSize }: { bpb: BpbHeader, index: number, setSize: (index: number, size: number) => void }) {
  const drawer = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMaxHeight, setDrawerMaxHeight] = useState("0px");
  const navigate = useNavigate();
  const { ref, height } = useResizeDetector({
    handleHeight: true,
    refreshMode: 'debounce',
    refreshRate: 100
  });

  useEffect(() => {
    setDrawerMaxHeight(drawer.current && drawerOpen ? `${drawer.current.scrollHeight}px` : "0px");
  }, [drawerOpen]);

  useEffect(() => {
    if (ref.current) {
      const measuredHeight = ref.current.getBoundingClientRect().height;
      setSize(index, measuredHeight);
    }
  }, [height, index, setSize]);

  return (
    <div className={`relative flex flex-col space-y-2 px-3 py-2 ${bpb.notified && "bg-red-50"} ${index % 2 === 0 ? "" : "bg-blue-50"} text-sm cursor-pointer border-b-1 border-gray-300 hover:bg-blue-100`} ref={ref} onClick={() => { setDrawerOpen(!drawerOpen) }} onDoubleClick={() => navigate(`/bpb/info/${bpb.nomor}`)}>
      <div className={`${!bpb.notified && "hidden"} absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full`}></div>
      <div className="flex justify-between items-center space-x-2">
        <div className="flex basis-6/12">
          <h1 className="font-semibold">{bpb.nomor}</h1>
          <p className={`text-xs mx-auto px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${bpb.status === "DONE" ? "bg-green-800" : bpb.status === "UNPUBLISHED" ? "bg-gray-500" : bpb.status === "PUBLISHED" ? "bg-blue-500" : bpb.status === "REJECTED" ? "bg-red-400" : bpb.status === "REVISION" ? "bg-yellow-500" : "bg-black"}`}>
            {bpb.status}
          </p>
        </div>
        <p className="basis-4/12 text-xs text-gray-500">{bpb.kepada}</p>
        <p className="basis-2/12 text-xs text-gray-500 text-start">{formatInTimeZone(bpb.tanggalTerbit, "Asia/Jakarta", "EEE, d MMMM yyyy HH:mm:ss")}</p>
      </div>
      
      <div ref={drawer} className={`transition-all duration-300 ease-in-out overflow-hidden ${drawerOpen ? "opacity-100" : "opacity-0"}`} style={{ maxHeight: drawerMaxHeight }}>
        <div className="flex">
          <div className="flex flex-col basis-5/12 space-x-3">
            <div className="w-full flex text-xs">
              <p className="basis-1/4 grow-0">Publisher</p>
              <p>:</p>
              <p className="ms-2">{bpb.dari}</p>
            </div>
            <div className="w-full flex text-xs">
              <p className="basis-1/4 grow-0">Reference</p>
              <p>:</p>
              <p className="ms-2">{bpb.ref}</p>
            </div>
          </div>
          <p className="grow self-center line-clamp-2">{bpb.keterangan}</p>
        </div>
        
        <div className="flex justify-between items-center gap-5 py-1">
          <p className="text-xs text-justify">{bpb.progress}</p>
          <div className="shrink-0 text-xs">
            <ButtonLayout text="Open Details" type="text" colorClass="blue-500" onClick={() => navigate(`/bpb/info/${bpb.nomor}`)} />
          </div>
        </div>
      </div>
    </div>
  );
};
