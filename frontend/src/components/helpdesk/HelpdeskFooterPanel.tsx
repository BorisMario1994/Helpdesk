import { faCheckCircle, faFile, faFileCircleXmark, faFileExcel, faFileImage, faFilePdf, faFileWord, faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox, Field, Label } from "@headlessui/react";
import { formatInTimeZone } from "date-fns-tz";
import { forwardRef, ReactEventHandler, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import Notes from "../../models/common/Notes";
import MentionEditor, { MentionEditorRef } from "../common/MentionEditor";
import BagianMaster from "../../models/master/BagianMaster";

export type HelpdeskFooterPanelRef = {
  validateFooterData: () => boolean;
  retrieveFooterData: () => { feedback: string, uploadedFile: File | undefined, message: string, mentions: string[] };
  checkReplyMessageExist: () => boolean;
};

type HelpdeskFooterPanelProps = {
  context: string;
  existingNoteList: Notes[];
  availableForMentionList: string[];
  bagianList: BagianMaster[];
  uploadedFile: File | undefined;
  submit: ReactEventHandler;
  printFAB: ReactEventHandler;
  printFSTB: ReactEventHandler;
  canGiveFeedback?: boolean;
  canComment?: boolean;
  canSubmit?: boolean;
  canReopen?: boolean;
  canSetDone?: boolean;
  canSetRevision?: boolean;
  canSetReject?: boolean;
  canPrintFab?: boolean;
  canPrintFstb?: boolean;
  showToast: (message: string) => void;
};

const HelpdeskFooterPanel = forwardRef<HelpdeskFooterPanelRef, HelpdeskFooterPanelProps>(({context, existingNoteList, availableForMentionList, bagianList, uploadedFile, submit, printFAB, printFSTB, canGiveFeedback = false, canComment = false, canSubmit = false, canReopen = false, canSetDone = false, canSetRevision = false, canSetReject = false, canPrintFab = false, canPrintFstb = false, showToast} : HelpdeskFooterPanelProps, ref) => {
  const auth = useAuth();
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
  
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [feedbackRevision, setFeedbackRevision] = useState(false);
  const [feedbackReject, setFeedbackReject] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(uploadedFile);

  const commentInput = useRef<MentionEditorRef>(null);
  const uploadFileInput = useRef<HTMLInputElement>(null);
  const noteContainerRef = useRef<HTMLDivElement>(null);

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
  }

  useEffect(() => {
    if (feedbackDone) {
      setFeedbackRevision(false);
      setFeedbackReject(false);
      return;
    }
  }, [feedbackDone]);

  useEffect(() => {
    if (feedbackRevision) {
      setFeedbackDone(false);
      setFeedbackReject(false);
      return;
    }
  }, [feedbackRevision]);

  useEffect(() => {
    if (feedbackReject) {
      setFeedbackDone(false);
      setFeedbackRevision(false);
      return;
    }
  }, [feedbackReject]);

  useEffect(() => {
    // Wait for layout to complete, then scroll
    const timeout = setTimeout(() => {
      noteContainerRef.current?.scrollTo({ top: noteContainerRef.current.scrollHeight, left: 0, behavior: "smooth" });
    }, 0);

    return () => clearTimeout(timeout);
  }, [existingNoteList]); // Run this whenever messages change

  useImperativeHandle(ref, () => ({
    validateFooterData: () => {
      if (commentInput.current) {
        const enteredMessage = commentInput.current.retrieveEnteredText()
        if (!checkText(enteredMessage.plainText)) {
          showToast("Please kindly recheck the entered text on job registration details.");
          return false;
        }
      }
      return true;
    },
    retrieveFooterData: () => {
      if (commentInput.current) {
        const enteredMessage = commentInput.current.retrieveEnteredText();
        return {
          feedback: (feedbackDone ? "DONE" : feedbackRevision ? "REVISION" : feedbackReject ? "REJECTED" : ""),
          uploadedFile: selectedFile ?? new File([], ""),
          message: enteredMessage.plainText,
          mentions: enteredMessage.mentions.map(mention => mention.id?.split(" ")[0] ?? "")
        };
      }

      return { feedback: "", uploadedFile: undefined, message: "", mentions: [] };
    },
    checkReplyMessageExist: () => {
      if ((commentInput.current?.retrieveEnteredText().plainText.length || 0) <= 0) {
        showToast("No reply comment is given. Failed to update helpdesk.");
        return false;
      }
      return true;
    }
  }));

  return (
    <div className="w-full flex flex-col justify-between gap-5 md:flex-row">
      <div className={`${context === "create" ? "hidden" : "flex"} flex-col gap-3 md:w-10/12 md:flex-row`}>
        <div className="flex flex-col grow-1 gap-2">
          <p className="text-sm text-gray-500">Note</p>
          <div ref={noteContainerRef} className="max-h-96 flex flex-col gap-2 overflow-auto border border-gray-300 rounded-lg select-text">
            {
              existingNoteList.length <= 0 ? 
              <p className="p-2 text-center text-sm">No comments yet.</p> : 
              <div className="flex flex-col gap-5 p-2 text-xs">
                {
                  existingNoteList.map((note, index) =>
                    ["revision_done", "reply_revision_done", "revision_recipient", "rejected_recipient", "reopen_publisher", "reopen_recipient"].includes(note.comment) || ["requesting_review_cc", "revision_cc", "rejected_cc", "reopen_cc"].includes(note.comment.substring(0, note.comment.indexOf("cc") + 2)) ?
                    <p key={note.linenum} className="max-w-3/4 self-center text-center text-xs text-gray-700 font-semibold">
                      {
                        note.comment === "revision_done" ? "Helpdesk was revised by publisher (" + note.username + ") on " + dateFormatter(note.tanggal) :  
                        note.comment === "reply_revision_done" ? "Helpdesk was revised by publisher's division / department head (" + note.username + ") by replying comments from MGMG on " + dateFormatter(note.tanggal) :
                        note.comment.substring(0, note.comment.lastIndexOf("_")) === "requesting_review" ? "Helpdesk was asked for review to " + existingNoteList[index - 1].mentions.join(",") + " by " + note.comment.split("_")[2].toUpperCase() + " (" + note.username + ") on " + dateFormatter(note.tanggal) :
                        note.comment.split("_")[0] === "approved" ? "Helpdesk was approved by " + note.comment.split("_")[1].toUpperCase() + " (" + note.username + ") on " + dateFormatter(note.tanggal) :
                        note.comment.split("_")[0] === "revision" ? "Helpdesk was asked for revision by " + (note.comment.split("_")[1] === "recipient" ? "recipient" : note.comment.split("_")[1].toUpperCase()) + " (" + note.username + ") on " + dateFormatter(note.tanggal) :
                        note.comment.split("_")[0] === "rejected" ? "Helpdesk was rejected by " + (note.comment.split("_")[1] === "recipient" ? "recipient" : note.comment.split("_")[1].toUpperCase()) + " (" + note.username + ") on " + dateFormatter(note.tanggal) :
                        note.comment.split("_")[0] === "reopen" ? "Helpdesk was reopened by " + (note.comment.split("_")[1].indexOf("cc") >= 0 ? note.comment.split("_")[1].toUpperCase() : note.comment.split("_")[1]) + " (" + note.username + ") on " + dateFormatter(note.tanggal) :
                        ""
                      }
                    </p> :
                    <div key={note.linenum} className={`flex flex-col gap-1 ${auth.scope?.username === note.username ? "items-end" : "items-start"}`}>
                      <p className="shrink-0 mt-1 font-semibold">{`${note.username} (${dateFormatter(note.tanggal)}):`}</p>
                      <pre className="max-w-10/12 px-3 py-2 border border-gray-400 rounded-xl text-wrap">
                        {
                          note.comment.split(/(@[\w-]*!)/g).map((part, index) => 
                            <span key={index} className={part.startsWith("@") ? "inline-block p-1 bg-blue-50 rounded-lg text-blue-500 font-semibold" : ""}>{part.startsWith("@") ? (part.indexOf("-") >= 0 ? part.replace("!", "") : part.replace("!", "").concat(part.substring(1, 5).length === 4 ? (" - " + bagianList.find(bagian => bagian.code === part.substring(1, 5))?.descrption) : "")) : part}</span>
                          )
                        }
                      </pre>
                    </div>
                  )
                }
              </div>
            }
          </div>
        </div>
        <div className="relative z-10 flex flex-col shrink-0 gap-3 md:w-4/12">
          <div className={`flex flex-col gap-1 ${!canComment && "hidden"}`}>
            <label className="text-sm font-semibold">{auth.scope?.username} ({new Date().toLocaleDateString()})</label>
            <MentionEditor ref={commentInput} availableForMentionList={availableForMentionList} />
          </div>

          <div className={canGiveFeedback ? "w-full flex items-center gap-3 px-2" : "hidden"}>
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
        </div>
      </div>
      <div className={`flex gap-5 justify-between items-center md:w-2/12 md:flex-col md:justify-start ${context === "create" ? "md:items-start" : "md:items-end"}`}>
        <div className={`${canGiveFeedback ? "flex flex-col gap-2" : "hidden"}`}>
          <Field className={`${canSetDone ? "flex" : "hidden"} items-center gap-2 text-green-700 cursor-pointer`}>
            <Checkbox checked={feedbackDone} onChange={setFeedbackDone} className="group block rounded-full border border-gray-400">
              <span className="opacity-0 group-data-checked:opacity-100"><FontAwesomeIcon icon={faCheckCircle} size="xl" /></span>
            </Checkbox>
            <Label>DONE</Label>
          </Field>
          <Field className={`${canSetRevision ? "flex" : "hidden"} items-center gap-2 text-yellow-500 cursor-pointer`}>
            <Checkbox checked={feedbackRevision} onChange={setFeedbackRevision} className="group block rounded-full border border-gray-400">
              <span className="opacity-0 group-data-checked:opacity-100"><FontAwesomeIcon icon={faCheckCircle} size="xl" /></span>
            </Checkbox>
            <Label>REVISION</Label>
          </Field>
          <Field className={`${canSetReject ? "flex" : "hidden"} items-center gap-2 text-red-500 cursor-pointer`}>
            <Checkbox checked={feedbackReject} onChange={setFeedbackReject} className="group block rounded-full border border-gray-400">
              <span className="opacity-0 group-data-checked:opacity-100"><FontAwesomeIcon icon={faCheckCircle} size="xl" /></span>
            </Checkbox>
            <Label>REJECT</Label>
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <div className={`w-32 text-sm ${!canSubmit && !canReopen && "hidden"}`}>
            <ButtonLayout text={context === "revision_info" && !canComment ? "Revise Helpdesk" : context === "doneCanReopen" && canReopen ? "Reopen" : "SUBMIT"} type={context === "doneCanReopen" && canReopen ? "outline" : "solid"} colorClass={context === "doneCanReopen" && canReopen ? "red-500" : "green-700"} onClick={submit} />
          </div>
          <div className={`w-32 text-sm ${!canPrintFab && "hidden"}`}>
            <ButtonLayout text="Print FAB" type="outline" colorClass="green-700" onClick={printFAB} />
          </div>
          <div className={`w-32 text-sm ${!canPrintFstb && "hidden"}`}>
            <ButtonLayout text="Print FSTB" type="outline" colorClass="green-700" onClick={printFSTB} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default HelpdeskFooterPanel;
