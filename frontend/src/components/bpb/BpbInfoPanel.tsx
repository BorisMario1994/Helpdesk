import { faFile, faFileCircleXmark, faFileExcel, faFileImage, faFilePdf, faFileWord, faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fieldset, Legend } from "@headlessui/react";
import { formatInTimeZone } from "date-fns-tz";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import BpbHeader from "../../models/bpb/BpbHeader";
import BPMaster from "../../models/master/BPMaster";

export type BpbInfoPanelRef = {
  validateInputData: () => boolean;
  retrieveInputData: () => Promise<BpbHeader>;
  panelHeight: number;
};

type BpbInfoPanelProps = {
  context: string;
  bpbHeader: BpbHeader;
  bpList: BPMaster[];
  setPanelHeight: Function;
  showToast: (message: string) => void;
};

const BpbInfoPanel = forwardRef<BpbInfoPanelRef, BpbInfoPanelProps>(({ context, bpList, bpbHeader, setPanelHeight, showToast }: BpbInfoPanelProps, ref) => {
  const auth = useAuth();
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "EEEE, d MMMM yyyy HH:mm:ss");

  const infoPanel = useRef<HTMLDivElement>(null);
  const keteranganInput = useRef<HTMLInputElement>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const uploadFileInput = useRef<HTMLInputElement>(null);

  const [bpOptionList, setBpOptionList] = useState<string[]>([]);
  const [selectedCardCode, setSelectedCardCode] = useState(bpbHeader.cardCode.length <= 0 ? "" : `${bpList.find(bp => bp.cardCode === bpbHeader.cardCode)?.cardName} (${bpbHeader.cardCode})`);
  const [selectedKepada, setSelectedKepada] = useState(bpbHeader.kepada);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(bpbHeader.namaFile.length > 0 ? new File([], bpbHeader.namaFile) : undefined);

  const [recipientInputError, setRecipientInputError] = useState("");
  const [kepadaInputError, setKepadaInputError] = useState("");
  const [keteranganInputError, setKeteranganInputError] = useState("");
  const [refInputError, setRefInputError] = useState("");

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
      if (selectedCardCode.length > 0 && !bpOptionList.find(bp => selectedCardCode.toUpperCase() === bp)) {
        showToast("Selected data is invalid.");
        setRecipientInputError("Selected Recipient is invalid.");
        return false;
      } else if (selectedKepada.length <= 0) {
        showToast("Helpdesk Data is incomplete. Cannot create / update helpdesk.");
        setKepadaInputError("Recipient is empty.");
        return false;
      } else if (selectedKepada.length > 0 && selectedCardCode.length > 0 && bpList.find(bp => selectedCardCode === `${bp.cardName} - (${bp.cardCode})` && selectedKepada === bp.street)) {
        showToast("Selected data is invalid.");
        setKepadaInputError("Selected Recipient Address is invalid.");
        return false;
      } else if (!checkText(keteranganInput.current?.value || "") || !checkText(refInput.current?.value || "")) {
        showToast("Please kindly recheck the entered text.");
        setKeteranganInputError(!checkText(keteranganInput.current?.value || "") ? "Please kindly recheck the entered text." : "");
        return false;
      }

      return true;
    },
    retrieveInputData: async() => {
      let newBpbHeader = new BpbHeader(bpbHeader.nomor.length > 0 ? bpbHeader.nomor : "", auth.scope?.username!, selectedCardCode.substring(selectedCardCode.lastIndexOf("(") + 1, selectedCardCode.lastIndexOf(")")), selectedKepada, "UNPUBLISHED", bpbHeader.status === "REVISION" ? bpbHeader.tanggalTerbit : new Date());
      newBpbHeader.keterangan = keteranganInput.current?.value || "";
      newBpbHeader.ref = refInput.current?.value || "";
      newBpbHeader.file = selectedFile ?? new File([], "");
      newBpbHeader.namaFile = selectedFile?.name || "";
      return newBpbHeader;
    },
    panelHeight: infoPanel.current ? infoPanel.current.scrollHeight : 0
  }));

  useEffect(() => {
    setPanelHeight(infoPanel.current?.scrollHeight || 0);
  }, [infoPanel.current?.scrollHeight]);

  useEffect(() => {
    setBpOptionList(bpList.filter((bp, index, self) => ((["DST", "PJL", "SLS"].includes(auth.scope?.username.substring(1, 4) || "") && bp.cardType === "C") || (["LOG", "PBL"].includes(auth.scope?.username.substring(1, 4) || "") && bp.cardType === "S")) && (bp.cardCode.substring(1, 2) === auth.scope?.username.substring(0, 1) || auth.scope?.username === "MLOG") && index === self.findIndex(bp2 => bp.cardCode === bp2.cardCode)).map(bp => `${bp.cardName} (${bp.cardCode})`));
  }, [bpList])

  return (
    <Fieldset as={Fragment}>
      <div ref={infoPanel} className={`space-y-3 ${context === "create" || context === "revision" ? "p-5 border border-gray-300 rounded-md shadow-md" : ""} overflow-hidden md:basis-1/2 md:self-start`}>
        <Legend className="font-semibold">Common Info</Legend>
        <div className={`${context === "create" && "hidden"} space-y-1`}>
          <p className="text-sm text-gray-500">{dateFormatter(bpbHeader.tanggalTerbit)}</p>
          <div className="flex justify-between items-center">
            <div className="flex space-x-5 items-center">
              <h3 className="text-xl font-bold select-text">{bpbHeader.nomor}</h3>
              <p className={`text-sm px-2 py-0.5 shadow-md rounded-full font-semibold text-white ${bpbHeader.status === "DONE" ? "bg-green-800" : bpbHeader.status === "UNPUBLISHED" ? "bg-gray-500" : bpbHeader.status === "PUBLISHED" ? "bg-blue-500" : bpbHeader.status === "REJECTED" ? "bg-red-400" : bpbHeader.status === "REVISION" ? "bg-yellow-500" : "bg-black"}`}>
                {bpbHeader.status}
              </p>
            </div>
          </div>
        </div>

        {
          !["create", "revision"].includes(context) ? 
          (
            <>
              <div className="flex flex-col space-x-5 md:flex-row">
                <div className="flex flex-col shrink-0 mt-5 md:basis-1/4">
                  <p className="text-sm text-gray-500">Publisher</p>
                  <p>{bpbHeader.dari}</p>
                </div>
                <div className="flex flex-col shrink-0 mt-5 md:basis-3/4">
                  <p className="text-sm text-gray-500">Recipient</p>
                  <pre className="text-wrap">{`${bpbHeader.cardCode.length > 0 ? (bpList.find(bp => bp.cardCode === bpbHeader.cardCode)?.cardName || "") + ` (${bpbHeader.cardCode})\n` : ""}${bpbHeader.kepada}`}</pre>
                </div>
              </div>


              <div className="flex flex-col mt-5">
                <p className="text-sm text-gray-500">Additional Info</p>
                <pre className="p-2 text-sm border border-gray-300 rounded-md text-wrap select-text">{bpbHeader.keterangan.length > 0 ? bpbHeader.keterangan : "No additional info."}</pre>
              </div>

              <div className="flex flex-col mt-5">
                <p className="text-sm text-gray-500">Reference</p>
                <pre className="p-2 text-sm border border-gray-300 rounded-md text-wrap select-text">{bpbHeader.ref.length > 0 ? bpbHeader.ref : "No reference."}</pre>
              </div>

              <p className="mb-1 text-sm text-gray-500">Publisher Attachment</p>
              <div className="flex flex-col p-2 border border-gray-400 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500"><FontAwesomeIcon icon={bpbHeader.namaFile.length <= 0 ? faFileCircleXmark : bpbHeader.namaFile.substring(bpbHeader.namaFile.lastIndexOf(".") + 1) === "pdf" ? faFilePdf : ["xls", "xlsx", "ods"].includes(bpbHeader.namaFile.substring(bpbHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileExcel : ["doc", "docx", "odt"].includes(bpbHeader.namaFile.substring(bpbHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileWord : ["png", "jpg", "jpeg"].includes(bpbHeader.namaFile.substring(bpbHeader.namaFile.lastIndexOf(".") + 1) || "") ? faFileImage : bpbHeader.namaFile.substring(bpbHeader.namaFile.lastIndexOf(".") + 1) === "zip" ? faFileZipper : faFile} size="lg" /></span>
                    <p className="text-sm">{bpbHeader.namaFile.length > 0 ? bpbHeader.namaFile : "No attachment uploaded."}</p>
                  </div>
                  <div className={`text-sm ${bpbHeader.namaFile.length <= 0 ? "hidden" : ""}`}>
                    <ButtonLayout text="Download" type="text" colorClass="green-700" onClick={() => bpbHeader.downloadFile(bpbHeader.namaFile)}/>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Finished Date</p>
                <p className="text-sm">{bpbHeader.tanggalSelesai.getFullYear() === 1900 ? "-" : dateFormatter(bpbHeader.tanggalSelesai)}</p>
              </div>
            </>
          ) :
          (
            <>
              <InputFieldLayout label="Recipient (Kepada)" type="combobox" id="dropdownCardCode" value={selectedCardCode} options={bpOptionList} onSelectChange={setSelectedCardCode} errorText={recipientInputError} onInputChange={() => setRecipientInputError("")} />

              <InputFieldLayout type="combobox" id="dropdownKepada" value={selectedKepada} options={bpList.filter(bp => `${bp.cardName} (${bp.cardCode})` === selectedCardCode).map(bp => bp.street)} onSelectChange={setSelectedKepada} errorText={kepadaInputError} onInputChange={() => setKepadaInputError("")} />

              <InputFieldLayout ref={keteranganInput} label="Additional Info (Keterangan)" type="textarea" id="txtBoxKeterangan" placeholder="Enter Additional Information" value={bpbHeader.keterangan} errorText={keteranganInputError} onInputChange={() => setKeteranganInputError("")} />

              <InputFieldLayout ref={refInput} label="Reference" type="text" id="txtBoxReference" placeholder="Enter Reference" value={bpbHeader.ref} errorText={refInputError} onInputChange={() => setRefInputError("")} />

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

export default BpbInfoPanel;
