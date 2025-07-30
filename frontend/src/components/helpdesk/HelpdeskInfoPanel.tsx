import { faArrowRight, faEquals, faExclamation, faExclamationTriangle, faFile, faFileCircleXmark, faFileExcel, faFileImage, faFilePdf, faFileWord, faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fieldset, Legend } from "@headlessui/react";
import { formatInTimeZone } from "date-fns-tz";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import BagianMaster from "../../models/master/BagianMaster";
import HelpdeskHeader from "../../models/helpdesk/HelpdeskHeader";

export type HelpdeskInfoPanelRef = {
  validateInputData: () => boolean;
  retrieveInputData: () => Promise<HelpdeskHeader>;
  panelHeight: number;
};

type HelpdeskInfoPanelProps = {
  context: string;
  helpdeskHeader: HelpdeskHeader;
  bagianList: BagianMaster[];
  setPanelHeight: Function;
  showToast: (message: string) => void;
};

const HelpdeskInfoPanel = forwardRef<HelpdeskInfoPanelRef, HelpdeskInfoPanelProps>(({ context, helpdeskHeader, bagianList, setPanelHeight, showToast }: HelpdeskInfoPanelProps, ref) => {
  const auth = useAuth();
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "EEEE, d MMMM yyyy HH:mm:ss");

  const infoPanel = useRef<HTMLDivElement>(null);
  const judulInput = useRef<HTMLInputElement>(null);
  const pertimbanganInput = useRef<HTMLInputElement>(null);
  const uploadFileInput = useRef<HTMLInputElement>(null);

  const [selectedTipe, setSelectedTipe] = useState(helpdeskHeader.tipe.length <= 0 ? "Select one" : helpdeskHeader.tipe);
  const [selectedPrioritas, setSelectedPrioritas] = useState(helpdeskHeader.prioritas.length <= 0 ? "Select one" : helpdeskHeader.prioritas);
  const [selectedKepada, setSelectedKepada] = useState(helpdeskHeader.kepada.length <= 0 ? "Select one" : helpdeskHeader.kepada.concat(" - ", bagianList.find(bagian => bagian.code === helpdeskHeader.kepada)?.descrption || ""));
  const [selectedFile, setSelectedFile] = useState<File | undefined>(helpdeskHeader.namaFile.length > 0 ? new File([], helpdeskHeader.namaFile) : undefined);

  const [judulInputError, setJudulInputError] = useState("");
  const [tipeInputError, setTipeInputError] = useState("");
  const [prioritasInputError, setPrioritasInputError] = useState("");
  const [kepadaInputError, setKepadaInputError] = useState("");
  const [pertimbanganInputError, setPertimbanganInputError] = useState("");

  const fileChosen = () => {
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

  const checkText = (text: string) => {
    const prohibitedText = [" COP ", " HOP ", " SEROJA ", " LUMINA ", " KAS I ", " KAS-I "];
    let valid = true;
    prohibitedText.forEach(txt => {
      if (text.toUpperCase().indexOf(txt) > -1) {
        valid = false;
        return;
      }
    });
    return valid;
  };

  useImperativeHandle(ref, () => ({
    validateInputData: () => {
      if ((judulInput.current?.value || "").length <= 0 || selectedTipe === "Select one" || selectedPrioritas === "Select one" || selectedKepada === "Select one") {
        showToast("Helpdesk Data is incomplete. Cannot create / update helpdesk.");
        setJudulInputError((judulInput.current?.value || "").length <= 0 ? "Helpdesk Title is empty." : "");
        setTipeInputError(selectedTipe === "Select one" ? "Helpdesk Type is empty." : "");
        setPrioritasInputError(selectedPrioritas === "Select one" ? "Helpdesk Priority not selected." : "");
        setKepadaInputError(selectedKepada === "Select one" ? "Recipient not selected." : "");
        return false;
      } else if (!checkText(judulInput.current?.value || "") || !checkText(pertimbanganInput.current?.value || "")) {
        showToast("Please kindly recheck the entered text.");
        setJudulInputError(!checkText(judulInput.current?.value || "") ? "Please kindly recheck entered text." : "");
        setPertimbanganInputError(!checkText(pertimbanganInput.current?.value || "") ? "Please kindly recheck the entered text." : "");
        return false;
      }

      return true;
    },
    retrieveInputData: async() => {
      let newHelpdeskHeader = new HelpdeskHeader(helpdeskHeader.nomor.length > 0 ? helpdeskHeader.nomor : "", judulInput.current?.value || "", selectedTipe, selectedPrioritas, auth.scope?.username!, selectedKepada.split(" - ")[0], helpdeskHeader.status === "REVISION" ? helpdeskHeader.tanggalTerbit : new Date(), helpdeskHeader.nomor.length > 0 ? helpdeskHeader.status : "UNPUBLISHED");
      newHelpdeskHeader.pertimbangan = pertimbanganInput.current?.value || "";
      newHelpdeskHeader.tanggalTerima = newHelpdeskHeader.status === "PUBLISHED" ? new Date() : helpdeskHeader.tanggalTerima;
      newHelpdeskHeader.file = selectedFile ?? new File([], "");
      newHelpdeskHeader.namaFile = selectedFile?.name || "";
      newHelpdeskHeader.namaFileKepada = helpdeskHeader.namaFileKepada;
      return newHelpdeskHeader;
    },
    panelHeight: infoPanel.current ? infoPanel.current.scrollHeight : 0
  }));

  useEffect(() => {
    setPanelHeight(infoPanel.current?.scrollHeight || 0);
  }, [infoPanel.current?.scrollHeight]);

  return (
    <Fieldset as={Fragment}>
      <div ref={infoPanel} className={`space-y-3 ${context === "create" || context === "revision" ? "p-5 border border-gray-300 rounded-md shadow-md" : ""} overflow-hidden md:basis-1/2 md:self-start`}>
        <Legend className="font-semibold">Common Info</Legend>
        <div className={`${context === "create" && "hidden"} space-y-1`}>
          <p className="text-sm text-gray-500">{dateFormatter(helpdeskHeader.tanggalTerbit)}</p>
          <div className="flex justify-between items-center">
            <div className="flex space-x-5 items-center">
              <h3 className="text-xl font-bold select-text">{helpdeskHeader.nomor}</h3>
              <p className={`text-sm px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${helpdeskHeader.status === "DONE" ? "bg-green-800" : helpdeskHeader.status === "UNPUBLISHED" ? "bg-gray-500" : helpdeskHeader.status === "PUBLISHED" ? "bg-blue-500" : helpdeskHeader.status === "REJECTED" ? "bg-red-400" : helpdeskHeader.status === "REVISION" ? "bg-yellow-500" : "bg-black"}`}>
                {helpdeskHeader.status}
              </p>
            </div>
            <div className={`${["create", "revision"].includes(context) ? "hidden" : "flex"} space-x-2 px-2 py-0.5 border rounded font-semibold ${helpdeskHeader.prioritas === "Normal" ? "border-gray-600 text-gray-600" : helpdeskHeader.prioritas === "Penting" ? "border-yellow-500 text-yellow-500" : "border-red-400 text-red-400"} text-sm`}>
              <span><FontAwesomeIcon icon={helpdeskHeader.prioritas === "Normal" ? faEquals : helpdeskHeader.prioritas === "Penting" ? faExclamation : faExclamationTriangle} /></span>
              <p>{helpdeskHeader.prioritas}</p>
            </div>
          </div>
          <p className={`${["create", "revision"].includes(context) ? "hidden" : ""} text-sm text-gray-600`}>{helpdeskHeader.tipe}</p>
        </div>

        {
          !["create", "revision"].includes(context) ? 
          (
            <>
              <p className="select-text">{helpdeskHeader.title}</p>
              <div className="flex justify-between items-center space-x-3 mt-5 p-2 border border-gray-500 rounded-md text-sm font-semibold">
                <p className="shrink-0">{helpdeskHeader.dari}</p>
                <span className="shrink-0"><FontAwesomeIcon icon={faArrowRight} /></span>
                <p>{helpdeskHeader.kepada.concat(" - ", bagianList.find(bagian => bagian.code === helpdeskHeader.kepada)?.descrption || "")}</p>
              </div>

              <div className="flex flex-col mt-5">
                <p className="text-sm text-gray-500">Consideration (Pertimbangan)</p>
                <pre className="p-2 text-sm border border-gray-300 rounded-md text-wrap select-text">{helpdeskHeader.pertimbangan.length > 0 ? helpdeskHeader.pertimbangan : "No comments."}</pre>
              </div>

              <p className="mb-1 text-sm text-gray-500">Publisher Attachment</p>
              <div className="flex flex-col p-2 border border-gray-400 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500"><FontAwesomeIcon icon={helpdeskHeader.namaFile.length <= 0 ? faFileCircleXmark : helpdeskHeader.namaFile.substring(helpdeskHeader.namaFile.lastIndexOf(".") + 1) === "pdf" ? faFilePdf : ["xls", "xlsx", "ods"].includes(helpdeskHeader.namaFile.substring(helpdeskHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileExcel : ["doc", "docx", "odt"].includes(helpdeskHeader.namaFile.substring(helpdeskHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileWord : ["png", "jpg", "jpeg"].includes(helpdeskHeader.namaFile.substring(helpdeskHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileImage : helpdeskHeader.namaFile.substring(helpdeskHeader.namaFile.lastIndexOf(".") + 1) === "zip" ? faFileZipper : faFile} size="lg" /></span>
                    <p className="text-sm">{helpdeskHeader.namaFile.length > 0 ? helpdeskHeader.namaFile : "No attachment uploaded."}</p>
                  </div>
                  <div className={`text-sm ${helpdeskHeader.namaFile.length <= 0 ? "hidden" : ""}`}>
                    <ButtonLayout text="Download" type="text" colorClass="green-700" onClick={() => helpdeskHeader.downloadFile(helpdeskHeader.namaFile)}/>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Received Date</p>
                <p className="text-sm">{helpdeskHeader.tanggalTerima.getFullYear() === 1900 ? "-" : dateFormatter(helpdeskHeader.tanggalTerima)}</p>
              </div>

              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Finished Date</p>
                <p className="text-sm">{helpdeskHeader.tanggalSelesai.getFullYear() === 1900 ? "-" : dateFormatter(helpdeskHeader.tanggalSelesai)}</p>
              </div>
              
              <p className="mb-1 text-sm text-gray-500">Recipient Attachment</p>
              <div className="flex flex-col p-2 border border-gray-400 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500"><FontAwesomeIcon icon={helpdeskHeader.namaFileKepada.length <= 0 ? faFileCircleXmark : helpdeskHeader.namaFileKepada.substring(helpdeskHeader.namaFileKepada.lastIndexOf(".") + 1) === "pdf" ? faFilePdf : ["xls", "xlsx", "ods"].includes(helpdeskHeader.namaFileKepada.substring(helpdeskHeader.namaFileKepada.lastIndexOf(".") + 1) || "") ? faFileExcel : ["doc", "docx", "odt"].includes(helpdeskHeader.namaFileKepada.substring(helpdeskHeader.namaFileKepada.lastIndexOf(".") + 1) || "") ? faFileWord : ["png", "jpg", "jpeg"].includes(helpdeskHeader.namaFileKepada.substring(helpdeskHeader.namaFileKepada.lastIndexOf(".") + 1) || "") ? faFileImage : helpdeskHeader.namaFileKepada.substring(helpdeskHeader.namaFileKepada.lastIndexOf(".") + 1) === "zip" ? faFileZipper : faFile} size="lg" /></span>
                    <p className="text-sm">{helpdeskHeader.namaFileKepada.length > 0 ? helpdeskHeader.namaFileKepada : "No attachment uploaded."}</p>
                  </div>
                  <div className={`text-sm ${helpdeskHeader.namaFileKepada.length <= 0 ? "hidden" : ""}`}>
                    <ButtonLayout text="Download" type="text" colorClass="green-700" onClick={() => helpdeskHeader.downloadFile(helpdeskHeader.namaFileKepada)}/>
                  </div>
                </div>
              </div>
            </>
          ) :
          (
            <>
              <InputFieldLayout ref={judulInput} label="Title (Judul)" type="text" id="txtBoxTitle" placeholder="Enter Helpdesk title" value={helpdeskHeader.title} errorText={judulInputError} onInputChange={() => setJudulInputError("")} />
              <div className="flex space-x-3">
                <InputFieldLayout label="Type" type="select" id="dropdownTipe" value={selectedTipe} options={["Permintaan", "Serah Terima"]} onSelectChange={setSelectedTipe} additionalClass="basis-1/2" errorText={selectedTipe === "Select one" ? tipeInputError : ""} />
                <InputFieldLayout label="Priority" type="select" id="dropdownPrioritas" value={selectedPrioritas} options={["Normal", "Penting", "Mendesak"]} onSelectChange={setSelectedPrioritas} additionalClass="basis-1/2" errorText={selectedPrioritas === "Select one" ? prioritasInputError : ""} />
              </div>
              <InputFieldLayout label="Recipient (Kepada)" type="select" id="dropdownKepada" value={selectedKepada} options={bagianList.map(bagian => `${bagian.code} - ${bagian.descrption}`)} onSelectChange={setSelectedKepada} additionalClass="w-full" errorText={selectedKepada === "Select one" ? kepadaInputError : ""} />
              <InputFieldLayout ref={pertimbanganInput} label="Consideration (Pertimbangan)" type="textarea" id="txtBoxPertimbangan" placeholder="Enter Consideration" value={helpdeskHeader.pertimbangan} errorText={pertimbanganInputError} onInputChange={() => setPertimbanganInputError("")} />
              <p className="text-sm text-gray-500">Attachment</p>
              <div className="w-full flex items-center gap-3 px-2">
                <span className="text-gray-500"><FontAwesomeIcon icon={(selectedFile?.size || 0) <= 0 ? faFileCircleXmark : selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1) === "pdf" ? faFilePdf : ["xls", "xlsx", "ods"].includes(selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileExcel : ["doc", "docx", "odt"].includes(selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileWord : ["png", "jpg", "jpeg"].includes(selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1) || "") ? faFileImage : selectedFile?.name.substring(selectedFile.name.lastIndexOf(".") + 1) === "zip" ? faFileZipper : faFile} size="lg" /></span>
                <p className="text-sm self-center overflow-hidden overflow-ellipsis">{selectedFile ? selectedFile.name : "No file attached." }</p>
                <div className="flex space-x-3 ml-auto">
                  <div className={`${!selectedFile && "hidden"} text-sm`}>
                    <ButtonLayout text="Remove" type="text" colorClass="red-500" onClick={removeUploadedFile} />
                  </div>
                  <div className="text-sm">
                    <ButtonLayout text="Upload" type="text" colorClass="green-700" onClick={() => uploadFileInput.current?.click()} />
                  </div>
                </div>
                <InputFieldLayout ref={uploadFileInput} id="uploadFile" type="file" onInputChange={fileChosen} additionalClass="hidden" />
              </div>
            </>
          )
        }
      </div>
    </Fieldset>
  );
});

export default HelpdeskInfoPanel;
