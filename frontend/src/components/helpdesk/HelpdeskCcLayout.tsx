import { faCheckCircle, faFile, faFileCircleXmark, faFileExcel, faFileImage, faFilePdf, faFileWord, faFileZipper, faHourglassHalf, faRotateLeft, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import BagianMaster from "../../models/master/BagianMaster";
import HelpdeskCc from "../../models/helpdesk/HelpdeskCc";
import User from "../../models/master/User";

type Props = {
  cc: HelpdeskCc;
  bagianList: BagianMaster[];
  setCc?: (linenum: number, cc: HelpdeskCc) => void;
  removeCc?: (linenum: number) => void;
  downloadFile?: (filename: string) => Promise<void>;
  existing?: boolean;
  canGiveFeedback?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canReject?: boolean;
  canRequestReview?: boolean;
  showToast?: (message: string) => void;
};


export function HelpdeskCcLayout({ cc, bagianList, setCc = (_: number, __: HelpdeskCc) => {  }, removeCc = (_: number) => {  }, downloadFile = async (_: string) => {  }, existing = true, canGiveFeedback = false, canUpdate = false, canDelete = false, canReject = false, canRequestReview = false, showToast = (_: string) => {  } }: Props) {
  //console.log("cc : ",cc)
  //console.log("ac : ",cc.pic )
  const auth = useAuth();
  const ccDetailsDrawer = useRef<HTMLDivElement>(null);
  const [ccDetailsDrawerOpen, setCcDetailsDrawerOpen] = useState(false);
  const [ccDetailsDrawerMaxHeight, setCcDetailsDrawerMaxHeight] = useState("0px");

  const [selectedCc, setSelectedCc] = useState(cc.cc.length > 0 ? cc.cc.concat(cc.cc.length === 4 ? (" - " + bagianList.find(bagian => bagian.code === cc.cc)?.descrption) : "")  : "Choose approver");
  const [selectedAc, setSelectedAc] = useState(cc.ac);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(cc.namaFile.length > 0 ? new File([], cc.namaFile) : undefined);
  const uploadFileInput = useRef<HTMLInputElement>(null);

  const [feedbackCCSupHead, setfeedbackCCSupHead] = useState("");
  const [canGiveFeedbackState, setCanGiveFeedbackState] = useState(canGiveFeedback);

  
  useEffect(() => {
 //   console.log("cc.pic raw value:", cc.pic, "length:", cc.pic?.length);
    if (!cc.pic || cc.pic.trim().length === 0) {
      const fallbackHead = cc.cc; // or auth.scope?.username if that's the fallback
      setfeedbackCCSupHead(fallbackHead);
  
      const newCanGiveFeedback = canGiveFeedback; // keep or replace with your condition
      setCanGiveFeedbackState(newCanGiveFeedback);
  
     // console.log("Immediate (no pic) → head:", fallbackHead, "canGiveFeedback:", newCanGiveFeedback);
      return;
    }
  
    User.getUserSupHead(cc.pic)
      .then(username => {
        // Set both pieces of state
        setfeedbackCCSupHead(username);
        const newCanGiveFeedback = username === auth.scope?.username;
        setCanGiveFeedbackState(newCanGiveFeedback);
  
        // Immediate debug log
       // console.log("Fetched sup head:", username);
       // console.log("Immediate canGiveFeedback:", newCanGiveFeedback);
      })
      .catch(() => {
        setfeedbackCCSupHead("");
        setCanGiveFeedbackState(false);
      //  console.log("Fetch failed → reset head + feedback permissions");
      });
  }, [cc.cc]);

/* 
 console.log("cc : ",cc.cc)
  console.log("head dari cc : ",feedbackCCSupHead)
  console.log("cc pic :" ,cc.pic)
  console.log("impersonate : " ,auth.scope?.username)
  console.log("fetch sup head : ",feedbackCCSupHead)
  console.log("cangivefeedbackstat : " ,canGiveFeedbackState)
  console.log("cangivefeedback : " ,canGiveFeedback)
  console.log("action : ",cc.ac)  */

  useEffect(() => {
    const updatedCc = new HelpdeskCc(cc.linenum, selectedCc === "Choose approver" ? "" : selectedCc, selectedAc, cc.tanggalAc, cc.pic, selectedFile ?? new File([], ""), selectedFile && selectedFile.size > 0 ? selectedFile.name : (selectedFile?.name.length || 0) > 0 ? cc.namaFile : "");
    setCc(cc.linenum, updatedCc);
    //console.log("cc pic : ",cc.pic)


  }, [selectedCc, selectedAc, selectedFile]);

  useEffect(() => {
    setCcDetailsDrawerMaxHeight(ccDetailsDrawer.current && ccDetailsDrawerOpen ? `${ccDetailsDrawer.current.scrollHeight + 200}px` : "0px");
  }, [ccDetailsDrawerOpen]);

  useEffect(() => {
    if (canUpdate || cc.ac === "REVISION")
      setCcDetailsDrawerOpen(true);
  }, [canUpdate]);

  const uploadDownloadFileButtonClicked = () => {
    if (canUpdate)
      uploadFileInput.current?.click();
    else
      downloadFile(cc.namaFile);
  };

  const fileChosen = async() => {
    if (uploadFileInput.current?.files && uploadFileInput.current.files.length > 0) {
      if (!["pdf", "zip", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx", "ods", "odt"].includes(uploadFileInput.current.files[0].name.substring(uploadFileInput.current.files[0].name.lastIndexOf(".") + 1))) {
        showToast("Uploaded file not supported. Please only upload the following file type: pdf, zip, png, jpg, jpeg, doc, docx, xls, xlsx, ods, and odt.");
        return;
      }
      setSelectedFile(uploadFileInput.current?.files[0]);
    }
  };

  const removeUploadedFile = () => {
    setSelectedFile(undefined);
    if (uploadFileInput.current)
      uploadFileInput.current.value = "";
  };

  return existing ?
  (
    <div className="relative flex flex-col p-2 border border-gray-500 rounded-lg text-sm" draggable={canDelete}>
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => canDelete ? ({}) : setCcDetailsDrawerOpen(!ccDetailsDrawerOpen)}>
        <p className="shrink-0 text-gray-500">{`Approver ${cc.linenum + 1}`}:</p>
        {
          canDelete ?
          <div className="grow-1 overflow-hidden">
          <InputFieldLayout type="select" id={`selectCc${cc.linenum}`} options={bagianList.filter(bagian => bagian.isActive).map(bagian => `${bagian.code}${bagian.descrption.length > 0 ? (" - " + bagian.descrption) : ""}`)} value={selectedCc} enabled={canDelete} onSelectChange={setSelectedCc} additionalClass="w-full" />
          </div> :
          <p className="font-semibold">{cc.cc.concat((bagianList.find(ccFind => ccFind.code === cc.cc)?.descrption.length || 0) > 0 ? (" - " + bagianList.find(ccFind => ccFind.code === cc.cc)?.descrption) : "")}</p>
        }
        <div className="flex space-x-2 ml-auto">
          <span className={`w-8 text-center ${cc.ac === "APPROVE" ? "text-green-700" : cc.ac === "REVISION" ? "text-yellow-500" : cc.ac === "REJECT" ? "text-red-500" : "text-gray-700"}`}><FontAwesomeIcon icon={cc.ac === "APPROVE" ? faCheckCircle : cc.ac === "REVISION" ? faRotateLeft : cc.ac === "REJECT" ? faXmarkCircle : faHourglassHalf} size="lg" /></span>
          <div className={`text-sm ${!canDelete && "hidden"}`}>
            <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={() => removeCc(cc.linenum)} />
          </div>
        </div>
        
      </div>
      <div className={`${!canUpdate && "hidden"} absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full`}></div>
      <div ref={ccDetailsDrawer} className={`transition-all duration-300 ease-in-out overflow-hidden ${ccDetailsDrawerOpen ? "opacity-100" : "opacity-0"}`} style={{ maxHeight: ccDetailsDrawerMaxHeight }}>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">Feedback</p>
          <p className={`${canGiveFeedbackState  ? "hidden" : ""} text-sm ${cc.ac === "APPROVE" ? "text-green-700" : cc.ac === "REVISION" ? "text-yellow-500" : cc.ac === "REJECT" ? "text-red-500" : "text-gray-800"} font-semibold`}>{cc.ac}</p>
         
          <InputFieldLayout id="feedbackInput" type="select" options={["APPROVE", "REVISION"].concat(canReject ? ["REJECT"] : []).concat(canRequestReview ? ["REQUESTING REVIEW"] : []).concat(auth.scope?.inferior || [])} value={selectedAc} onSelectChange={setSelectedAc} additionalClass={`${canGiveFeedbackState  ? "w-48" : "hidden"}`} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-sm text-gray-500">Feedback Date</p>
          <p className="text-sm font-semibold">{cc.tanggalAc.getFullYear() === 1900 ? "-" : formatInTimeZone(cc.tanggalAc, "Asia/Jakarta", "EEEE, d MMMM yyyy HH:mm:ss")}</p>
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-sm text-gray-500">PIC</p>
          <p className="text-sm font-semibold"> {cc.pic.length > 0 ? cc.pic : "-"} </p>
        </div>
        <div className="flex flex-col justify-between mt-2">
          <p className="text-sm text-gray-500">Approver's Attachment</p>
          <div className="flex items-center mt-1">
            <span className="text-gray-500 mr-2"><FontAwesomeIcon icon={!selectedFile ? faFileCircleXmark : selectedFile.name.substring(selectedFile.name.lastIndexOf(".") + 1) === "pdf" ? faFilePdf : ["xls", "xlsx", "ods"].includes(selectedFile.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileExcel : ["doc", "docx", "odt"].includes(selectedFile.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileWord : ["png", "jpg", "jpeg"].includes(selectedFile.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileImage : selectedFile.name.substring(selectedFile.name.lastIndexOf(".") + 1) === "zip" ? faFileZipper : faFile} size="lg" /></span>
            <p className="text-sm self-center">{selectedFile && selectedFile.name.length > 0 ? cc.namaFile : "No file attached." }</p>
            <div className={`flex shrink-0 ml-auto space-x-3 ${canUpdate || (!canUpdate && selectedFile && selectedFile.name.length > 0) ? "" : "hidden"}`}>
              <div className={`${!(canUpdate && selectedFile) && "hidden"}`}>
                <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={removeUploadedFile} />
              </div>
              <div>
                <ButtonLayout text={`${canUpdate ? "Upload" : "Download"}`} type="text" colorClass="green-700" onClick={uploadDownloadFileButtonClicked} />
              </div>
            </div>
            <InputFieldLayout ref={uploadFileInput} id="uploadFile" type="file" onInputChange={fileChosen} additionalClass="hidden" />
          </div>
        </div>
      </div>
    </div>
  ) :
  (
    <div className="w-full flex justify-between items-center gap-2 text-sm overflow-hidden">
      <p className="shrink-0 text-gray-500 text-nowrap">{`Approver ${cc.linenum + 1}`}</p>
      <div className="grow-1 overflow-hidden">
        <InputFieldLayout type="select" id={`selectCc${cc.linenum}`} options={bagianList.filter(bagian => bagian.isActive).map(bagian => `${bagian.code}${bagian.descrption.length > 0 ? (" - " + bagian.descrption) : ""}`)} value={selectedCc} enabled={canUpdate} onSelectChange={setSelectedCc} additionalClass="w-full" />
      </div>
      <div className={`shrink-0 ${!canDelete && "hidden"}`}>
        <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={() => removeCc(cc.linenum)} />
      </div>
    </div>
  );
};
