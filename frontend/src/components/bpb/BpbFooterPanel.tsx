import { formatInTimeZone } from "date-fns-tz";
import { forwardRef, ReactEventHandler, useEffect, useImperativeHandle, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import Notes from "../../models/common/Notes";
import MentionEditor, { MentionEditorRef } from "../common/MentionEditor";
import BagianMaster from "../../models/master/BagianMaster";

export type BpbFooterPanelRef = {
  validateFooterData: () => boolean;
  retrieveFooterData: () => { message: string, mentions: string[] };
  checkReplyMessageExist: () => boolean;
};

type BpbFooterPanelProps = {
  context: string;
  existingNoteList: Notes[];
  availableForMentionList: string[];
  bagianList: BagianMaster[];
  submit: ReactEventHandler;
  printFAB: ReactEventHandler;
  printFSTB: ReactEventHandler;
  canComment?: boolean;
  canSubmit?: boolean;
  canPrintFab?: boolean;
  showToast: (message: string) => void;
};

const BpbFooterPanel = forwardRef<BpbFooterPanelRef, BpbFooterPanelProps>(({context, existingNoteList, availableForMentionList, bagianList, submit, printFAB, canComment = false, canSubmit = false, canPrintFab = false, showToast} : BpbFooterPanelProps, ref) => {
  const auth = useAuth();
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");

  const commentInput = useRef<MentionEditorRef>(null);
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
          message: enteredMessage.plainText,
          mentions: enteredMessage.mentions.map(mention => mention.id?.split(" ")[0] ?? "")
        };
      }

      return { message: "", mentions: [] };
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
    <div className={`w-full flex flex-col justify-between gap-5 md:flex-row`}>
      <div className={`flex flex-col basis-8/12 grow-1 gap-2 ${context === "create" ? "hidden" : "flex"}`}>
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
      <div className="flex flex-col basis-4/12 gap-3">
        <div className={`${context === "create" || !canComment ? "hidden" : "flex"} flex-col`}>
          <label className="text-sm font-semibold">{auth.scope?.username} ({new Date().toLocaleDateString()})</label>
          <MentionEditor ref={commentInput} availableForMentionList={availableForMentionList} />
        </div>

        <div className={`w-32 ${context === "create" ? "self-start" : "self-end"} text-sm ${!canSubmit && "hidden"}`}>
          <ButtonLayout text={context === "revision_info" && !canComment ? "Revise BPB" : "SUBMIT"} type="solid" colorClass="green-700" onClick={submit} />
        </div>
        <div className={`w-32 self-end text-sm ${!canPrintFab && "hidden"}`}>
          <ButtonLayout text="Print FAB" type="outline" colorClass="green-700" onClick={printFAB} />
        </div>
      </div>
    </div>
  );
});

export default BpbFooterPanel;
