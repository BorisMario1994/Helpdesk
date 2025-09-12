import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import HelpdeskCcListPanel, { HelpdeskCcListPanelRef } from "./HelpdeskCcListPanel";
import HelpdeskDetailsListPanel, { HelpdeskDetailsListPanelRef } from "./HelpdeskDetailsListPanel";
import HelpdeskFooterPanel, { HelpdeskFooterPanelRef } from "./HelpdeskFooterPanel";
import HelpdeskInfoPanel, { HelpdeskInfoPanelRef } from "./HelpdeskInfoPanel";
import { ManageHelpdeskSuccessDialog } from "./ManageHelpdeskSuccessDialog";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import { InformationDialog } from "../dialogs/InformationDialog";
import { LoadingDialog } from "../dialogs/LoadingDialog";
import { ButtonLayout } from "../common/ButtonLayout";
import AktivaMaster from "../../models/master/AktivaMaster";
import BagianMaster from "../../models/master/BagianMaster";
import HelpdeskHeader from "../../models/helpdesk/HelpdeskHeader";
import HelpdeskDetails from "../../models/helpdesk/HelpdeskDetails";
import Notes from "../../models/common/Notes";
import OrderMaster from "../../models/master/OrderMaster";
import User from "../../models/master/User";

type PageContext = {
  isMobileSize: boolean;
  setShowToast: Function; 
  setToastMessage: Function;
};

export function ManageHelpdeskPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { mode, nomor } = useParams<{ mode: string, nomor?: string }>();
  const { isMobileSize, setShowToast, setToastMessage } = useOutletContext<PageContext>();

  const [helpdeskHeader, setHelpdeskHeader] = useState(new HelpdeskHeader("", "", "", "", "", "", new Date(), ""));
  const [orderMasterList, setOrderMasterList] = useState<OrderMaster[]>([]);
  const [aktivaMasterList, setAktivaMasterList] = useState<AktivaMaster[]>([]);
  const [bagianList, setBagianList] = useState<BagianMaster[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [publisherDeptHead, setPublisherDeptHead] = useState("");
  const [feedbackCCSupHead, setfeedbackCCSupHead] = useState("");
  
  const helpdeskInfoPanelRef = useRef<HelpdeskInfoPanelRef>(null);
  const helpdeskDetailsListPanelRef = useRef<HelpdeskDetailsListPanelRef>(null);
  const helpdeskCcListPanelRef = useRef<HelpdeskCcListPanelRef>(null);
  const helpdeskFooterPanelRef = useRef<HelpdeskFooterPanelRef>(null);
  
  const [context, setContext] = useState("");
  const [mainRole, setMainRole] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [revisionFromGMG, setRevisionFromGMG] = useState(false);
  const [noteFromGMG, setNoteFromGMG] = useState(false);
  const [availableForMentionList, setAvailableForMentionList] = useState<string[]>([]);
  const [allowedJobRegToShow, setAllowedJobRegToShow] = useState<HelpdeskDetails[]>([]);
  const [temporaryJobRegStatus, setTemporaryJobRegStatus] = useState<string[]>([]);
  const [commentEnabled, setCommentEnabled] = useState(false);

  const [helpdeskInfoPanelHeight, setHelpdeskInfoPanelHeight] = useState(0);
  const [revisionDoneConfirmation, setRevisionDoneConfirmation] = useState(false);
  const mentionedUserNeedsToBeAddedToCcListConfirmationRef = useRef<boolean>(false);
  const continueByIgnoringMentionedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [confirmationDialogContext, setConfirmationDialogContext] = useState("");
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = useState("");
  const [confirmationDialogMessage, setConfirmationDialogMessage] = useState("");
  const [confirmationDialogButton, setConfirmationDialogButton] = useState<"YesNo" | "ConfirmCancel">("YesNo");

  const [informationDialogOpen, setInformationDialogOpen] = useState(false);
  const [informationDialogTitle, setInformationDialogTitle] = useState("");
  const [informationDialogMessage, setInformationDialogMessage] = useState("");
  const [informationDialogRedirectOnClose, setInformationDialogRedirectOnClose] = useState(false);

  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDialogNomorHelpdesk, setSuccessDialogNomorHelpdesk] = useState("");

  
  const loadRequiredData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      if (!auth.accessToken)
        await auth.refresh();

      setUserList(await User.getUserListAdjustedSuperior());
      setBagianList(await BagianMaster.getBagianMasterList());
      setOrderMasterList(await OrderMaster.getOrderMasterList());
      setAktivaMasterList(await AktivaMaster.getAktivaMasterList());

      if (nomor) {
        let newHelpdesk = await HelpdeskHeader.getHelpdeskByNumber(nomor);
        setPublisherDeptHead(await User.getUserDeptHead(newHelpdesk.dari));
        setHelpdeskHeader(newHelpdesk);
      }
      setIsLoading(false);
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await loadRequiredData();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          setIsLoading(false);
          setIsError(true);
          break;
      }
    }
  };

  const showInformationDialog = (title: string, message: string, redirectOnClose: boolean = false) => {
    setInformationDialogTitle(title);
    setInformationDialogMessage(message);
    setInformationDialogRedirectOnClose(redirectOnClose);
    setInformationDialogOpen(true);
  };

  

  const showConfirmationDialog = (context: string, title: string, message: string, button: "YesNo" | "ConfirmCancel") => {
    setConfirmationDialogContext(context);
    setConfirmationDialogTitle(title);
    setConfirmationDialogMessage(message);
    setConfirmationDialogButton(button);
    setConfirmationDialogOpen(true);
  };

  const closeInformationDialog = () => {
    setInformationDialogOpen(false);
    if (informationDialogRedirectOnClose)
      navigate("/helpdesk/main/all", { replace: true });
  };

  const downloadFile = async (fileName: string) => {
    try {
      await helpdeskHeader.downloadFile(fileName);
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await downloadFile(fileName);
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          showToast("An error has occured while downloading the file. If the problem persist, please contact ISW.");
          break;
      }
    }
  };  

  const revisionConfirmation = () => {
    setRevisionDoneConfirmation(false);
    showConfirmationDialog("revisionDone", "Revise Helpdesk", "Finish revising this Helpdesk? (Future changes are still allowed if revision process hasn't finish)", "YesNo");
  };

  const mentionCheckingAndConfirmation = (type: string) => {
    switch(type) {
      case "mentionedUserNeedsToBeAddedToCcList":
        showConfirmationDialog("mentionedUserNeedsToBeAddedToCcList", "Additional Approval Required", "One or more mention(s) is not registered as Approver in the approver list. Add those mentioned division(s) / department(s) to approval list?", "YesNo");
        break;
      case "continueByIgnoringMentioned":
        showConfirmationDialog("continueByIgnoringMentioned", "Continue to Process Helpdesk", "One or more mentioned division(s) / department(s) are not giving any response on the requested review. Continue to process the helpdesk?", "YesNo");
        break;
      default:
        break;
    }
  }

  const submitConfirmation = () => {
    let title = "";
    let message = "";
    if (context === "create") {
      title = "Create New Helpdesk";
      message = "Confirm to create this new Helpdesk?";
    } else if (context === "revision") {
      title = "Revise Helpdesk";
      message = "Confirm to revise this helpdesk?";
    } else if (context === "revision_info") {
      title = "Reply Comment for Revision";
      message = "Replying the comment of this Helpdesk send it back to GMG. Confirm to reply comments for this Helpdesk?";
    } else if (context.substring(0, 10) === "ccFeedback") {
      title = "Update CC Feedback";
      message = "Confirm to give feedback for this Helpdesk?";
    } else if (context === "recipientFeedback") {
      title = "Update Helpdesk Feedback";
      message = "Confirm to give feedback and update job registrations of this Helpdesk?";
    } else if (context === "doneCanReopen") {
      title = "Reopen Helpdesk";
      message = "Confirm to re-open this Helpdesk?";
    }

    message += " (Make sure all the data are correct and appropriately filled before submitting)";
    showConfirmationDialog("createOrUpdateDone", title, message, "ConfirmCancel");
  };

  const checkSubmittedDataNeedsResetCc = async () => {
    const newHelpdeskHeader = await helpdeskInfoPanelRef.current!.retrieveInputData();
    newHelpdeskHeader.detailsList = [...helpdeskDetailsListPanelRef.current!.retrieveDetailsListData()];
    newHelpdeskHeader.ccList = [...helpdeskCcListPanelRef.current!.retriveCcListData()];

    let detailsChanged = false;
    if (newHelpdeskHeader.detailsList.length !== helpdeskHeader.detailsList.length) 
      detailsChanged = true;
    else {
      newHelpdeskHeader.detailsList.forEach(details => {
        let index = details.linenum;
        if (details.order !== helpdeskHeader.detailsList[index].order || details.keterangan !== helpdeskHeader.detailsList[index].keterangan || details.jumlah !== helpdeskHeader.detailsList[index].jumlah)
          detailsChanged = true;
      });
    }
    return (newHelpdeskHeader.title !== helpdeskHeader.title || (newHelpdeskHeader.file.size <= 0 && newHelpdeskHeader.file.name !== helpdeskHeader.namaFile) || (newHelpdeskHeader.file.size > 0 && await newHelpdeskHeader.hashUploadedFile() !== helpdeskHeader.hashedFile) || detailsChanged) && newHelpdeskHeader.ccList.find(cc => cc.ac === "APPROVE");
  };

  const submitClicked = async () => {

   /*   console.log("=== Submit Clicked ===");
     console.log("context:", context);
    console.log("currentRole:", currentRole); */
    // console.log("helpdeskHeader:", helpdeskHeader);
    // console.log("auth:", auth);
    
    if (context === "revision_info" && helpdeskHeader.status === "REVISION" && helpdeskHeader.dari === auth.scope?.username) {
      navigate(`/helpdesk/revision/${helpdeskHeader.nomor}`);
      return;
    } 

    if (["create", "revision"].includes(context) && (!helpdeskInfoPanelRef.current!.validateInputData() || !helpdeskDetailsListPanelRef.current!.validateDetailsListData() || !helpdeskCcListPanelRef.current!.validateCcListData() || !helpdeskFooterPanelRef.current!.validateFooterData()))
      return;

    else if (context === "revision_info" && (!helpdeskFooterPanelRef.current!.validateFooterData() || !helpdeskFooterPanelRef.current!.checkReplyMessageExist())) 
      return;
    else if (context.substring(0, 10) === "ccFeedback" && currentRole === "cc") {
      const updatedCc = helpdeskCcListPanelRef.current!.retriveUpdatedCcData();
      const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();

      if (updatedCc.ac === "NO ACTION") {
        showInformationDialog("Action Required", "User must choose an action before submit");
        return;
      }
      
      if ((["REVISION", "REJECT", "REQUESTING REVIEW"].includes(updatedCc.ac) || (helpdeskHeader.ccList.find(cc => cc.cc === "MGMG" && cc.ac === "REQUESTING REVIEW") && helpdeskHeader.noteList.filter(note => note.comment.indexOf("requesting_review") >= 0).pop()?.mentions.includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.superior.substring(0, 4) === "MGMG")) && footerData.message.trim().length <= 0) {
        showToast("Please add a comment.");
        return;
      } else if (updatedCc.ac !== "REQUESTING REVIEW" && footerData.mentions.length > 0) {
        showToast("Mentioning must be with 'REQUESTING REVIEW' feedback.");
        return;
      } else if (updatedCc.ac === "REQUESTING REVIEW") {
        if (!footerData.mentions.find(mention => availableForMentionList.includes(mention) || availableForMentionList.includes(mention.concat(" - ", bagianList.find(bagian => bagian.code === mention)?.descrption || "")))) {
          showToast("No valid mention exists. Cannot proceed to update the Helpdesk.");
          return;
        } else if (helpdeskHeader.ccList.find(cc => cc.ac === "REQUESTING REVIEW")) {
          showToast("Cannot stack 'REQUESTING REVIEW' feedback.");
          return;
        } else if (auth.scope?.username === "MGMG-01" && !helpdeskHeader.ccList.find(cc => footerData.mentions.includes(cc.cc)) && !mentionedUserNeedsToBeAddedToCcListConfirmationRef.current) {
          mentionCheckingAndConfirmation("mentionedUserNeedsToBeAddedToCcList");
          return;
        }
      } else if (updatedCc.ac !== "REQUESTING REVIEW" && helpdeskHeader.ccList.find(cc => cc.linenum === updatedCc.linenum)?.ac === "REQUESTING REVIEW" && !continueByIgnoringMentionedRef.current) {
        mentionCheckingAndConfirmation("continueByIgnoringMentioned");
        return;
      }
    }

    else if (context.substring(0, 10) === "ccFeedback" && currentRole === "reviewer" && !helpdeskFooterPanelRef.current!.checkReplyMessageExist())
      return;

    else if (context === "recipientFeedback") {
      if (!helpdeskDetailsListPanelRef.current!.validateDetailsListData() || !helpdeskFooterPanelRef.current!.validateFooterData())
        return;
      const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
      if (currentRole === "publisher" && footerData.message.trim().length <= 0) {
        showToast("Please add a comment.");
        return;
      }

      if (["REVISION", "REJECTED"].includes(footerData.feedback) && footerData.message.trim().length <= 0) {
        showToast("Please add a comment.");
        return;
      }
    }

    if (context === "revision") {
      revisionConfirmation();
      return;
    }
    submitConfirmation();
  };

  const confirmationDialogResponse = async (res: boolean) => {
    if (confirmationDialogContext === "revisionDone") {
      setRevisionDoneConfirmation(res);

      if (await checkSubmittedDataNeedsResetCc()) {
        setTimeout(() => {
          showConfirmationDialog("resetCc", "Revise Helpdesk", "Changes on title, attachment, or Job Registration will reset all approval back to first Approver. Confirm to revise this helpdesk and reset its approval process?", "ConfirmCancel");
        }, 200);
      } else {
        setTimeout(() => submitConfirmation(), 200);
      }
    } else if (confirmationDialogContext === "resetCc") {
      if (res) 
        setTimeout(() => submitConfirmation(), 200);
    } else if (["mentionedUserNeedsToBeAddedToCcList","continueByIgnoringMentioned"].includes(confirmationDialogContext)) {
      if (!res) {
        mentionedUserNeedsToBeAddedToCcListConfirmationRef.current = false;
        continueByIgnoringMentionedRef.current = false;
        return;
      }

      if (confirmationDialogContext === "mentionedUserNeedsToBeAddedToCcList")
        mentionedUserNeedsToBeAddedToCcListConfirmationRef.current = true;
      else if (confirmationDialogContext === "continueByIgnoringMentioned")
        continueByIgnoringMentionedRef.current = true;
      setTimeout(() => {
        submitClicked();
      }, 200)
    } else if (confirmationDialogContext === "createOrUpdateDone") {
      if (!res) {
        mentionedUserNeedsToBeAddedToCcListConfirmationRef.current = false;
        continueByIgnoringMentionedRef.current = false;
        return;
      }
      submitData();
    }
  };

  const submitData = async () => {
    try {
      setLoadingDialogOpen(true);
      if (context === "create" || context === "revision")
        await createOrUpdateHelpdeskHeader();
      else if (context === "revision_info")
        await updateHelpdeskFromDeptHead();
      else if (context.substring(0, 10) === "ccFeedback" && ["cc", "ccPic","ccPicSup"].includes(currentRole))
        await updateCcFeedback();
      else if (context.substring(0, 10) === "ccFeedback" && currentRole === "reviewer") 
        await replyForReview();
      else if (context === "recipientFeedback" && currentRole === "publisher")
        await updateHelpdeskNote("follow-up");
      else if (context === "recipientFeedback" && currentRole === "recipient")
        await updateRecipientFeedback();
      else if (context === "recipientFeedback" && currentRole === "recipientPic")
        await updateJobRegistration();
      else if (context === "doneCanReopen")
        await helpdeskHeader.reopenHelpdesk(mainRole);

      setSuccessDialogOpen(true);
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await submitData();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          showToast("An error has occured when creating / updating Helpdesk data. If the problem persist, please contact ISW.");
          break;
      }
    } finally {
      setLoadingDialogOpen(false);
    }
  };

  const createOrUpdateHelpdeskHeader = async () => {
    const newHelpdeskHeader = await helpdeskInfoPanelRef.current!.retrieveInputData();
    newHelpdeskHeader.detailsList = [...helpdeskDetailsListPanelRef.current!.retrieveDetailsListData()];
    newHelpdeskHeader.ccList = [...helpdeskCcListPanelRef.current!.retriveCcListData()];
    if (newHelpdeskHeader.ccList.length <= 0) {
      newHelpdeskHeader.status = "PUBLISHED";
      newHelpdeskHeader.tanggalTerima = new Date();
    }
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);

    if (context === "create") {
      newHelpdeskHeader.nomor = await newHelpdeskHeader.createHelpdesk();
      setSuccessDialogNomorHelpdesk(newHelpdeskHeader.nomor);
    } else if (context === "revision") {
      if (await checkSubmittedDataNeedsResetCc()) {
        newHelpdeskHeader.ccList.map(cc => {
          cc.ac = "NO ACTION";
          return cc;
        });
      }

      if (revisionDoneConfirmation) {
        if (!newHelpdeskHeader.ccList.find(cc => cc.ac !== "APPROVE")) {
          newHelpdeskHeader.status = "PUBLISHED";
          newHelpdeskHeader.tanggalTerima = new Date();
        } else {
          newHelpdeskHeader.status = "UNPUBLISHED";
          const revisionCc = newHelpdeskHeader.ccList.find(cc => cc.ac === "REVISION");
          if (revisionCc)
            revisionCc.ac = "NO ACTION";
        }
      }

      await newHelpdeskHeader.reviseHelpdesk(note);
      setSuccessDialogNomorHelpdesk(newHelpdeskHeader.nomor);
    } 
  };

  const updateHelpdeskNote = async (type: string) => {
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    return helpdeskHeader.updateHelpdeskNote(type, note);
  }

  const updateHelpdeskFromDeptHead = async () => {
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    return helpdeskHeader.reviseHelpdeskFromDeptHead(note);
  };

  const updateCcFeedback = async () => {
    const updatedCc = helpdeskCcListPanelRef.current!.retriveUpdatedCcData();
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    if (currentRole === "ccPic")
      updatedCc.ac = "NO ACTION";
    
    return updatedCc.updateCcData(helpdeskHeader.nomor, note);
  };

  const replyForReview = async () => {
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    return helpdeskHeader.replyForReview(note);
  }

  const updateRecipientFeedback = async () => {
    if (!helpdeskDetailsListPanelRef.current?.validateDetailsListData)
      return;
    const updatedDetailsList = [...helpdeskDetailsListPanelRef.current!.retrieveDetailsListData()];
    const footerData = helpdeskFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);

    if (["REVISION", "REJECTED"].includes(footerData.feedback) && note.comment.trim().length <= 0) {
      showToast("Please add a comment.");
      return;
    }
    return HelpdeskHeader.updateHelpdeskFeedbackAndJobReg(helpdeskHeader.nomor, { feedback: footerData.feedback, file: footerData.uploadedFile ?? new File([], "") }, updatedDetailsList, note);
  };

  const updateJobRegistration = async () => {
    const updatedDetailsList = [...helpdeskDetailsListPanelRef.current!.retrieveDetailsListData()];
    updatedDetailsList.forEach(details => {
      const oldDetails = helpdeskHeader.detailsList[details.linenum];
      if (details.pic !== oldDetails.pic && details.ts !== oldDetails.ts) {
        details.tanggalTerima = new Date();
        details.tanggalSelesai = details.status === "DONE" ? new Date() : new Date("1900-01-01");
      } else if (details.status === "DONE" && oldDetails.status === "WAITING") {
        details.tanggalSelesai = new Date();
      } else if (details.status === "WAITING" && oldDetails.status === "DONE") {
        details.tanggalSelesai = new Date("1900-01-01");
      }
    })

    const newDetailsList = [...helpdeskHeader.detailsList.map(details => updatedDetailsList.find(d => d.linenum === details.linenum) ?? details)];
    return HelpdeskHeader.updateJobRegistration(helpdeskHeader.nomor, newDetailsList);
  };

function getSimpleCode(input, length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Base36 (easy & readable)

  // Simple hash (FNV-1a 32-bit)
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Convert hash -> base36 code
  let num = hash >>> 0; // unsigned
  let out = "";
  for (let i = 0; i < length; i++) {
    out = chars[num % chars.length] + out;
    num = Math.floor(num / chars.length);
  }
  return out;
}



// example usage in your existing functions
const printFab = async () => {
  const uniq = await getSimpleCode(helpdeskHeader.nomor, 6); // deterministic from NOMOR
  console.log(helpdeskHeader.nomor + ' ' + uniq)
  const url = "http://192.168.52.34/REPORTS/report/Data%20Sources/REPORT/HELPDESK2"
    + "?rs:Command=Render"
    + "&NOMOR=" + encodeURIComponent(helpdeskHeader.nomor)
    + "&UNIQ=" + encodeURIComponent(uniq);
  window.open(url, "_blank");
};

const printFstb = async () => {
  const uniq = await getSimpleCode(helpdeskHeader.nomor, 6); // same deterministic code
  const url = "http://192.168.52.34/REPORTS/report/Data%20Sources/REPORT/FSTB2"
    + "?rs:Command=Render"
    + "&NOMOR=" + encodeURIComponent(helpdeskHeader.nomor)
    + "&UNIQ=" + encodeURIComponent(uniq);
  window.open(url, "_blank");
};


  const showToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const closePage = () => {
    setSuccessDialogOpen(false);
    navigate("/helpdesk/main/created", { replace: true });
  };

  useEffect(() => {
    loadRequiredData();
    //console.log("mode change")
  }, [mode]);

  useEffect(() => {
   // console.log("helpdeskheader change")

    if (mode === "create") {
      setContext("create");
      setMainRole("publisher");
      setCurrentRole("publisher");
    } else {
      if (helpdeskHeader.nomor.length <= 0)
        return;
      const availableMentionList = [...helpdeskHeader.ccList.map(cc => `${cc.cc}${!bagianList.find(bagian => bagian.code === cc.cc) ? "" : (" - " + bagianList.find(bagian => bagian.code === cc.cc)?.descrption)}`)];
      if (auth.scope?.username === "MGMG-01")
        availableMentionList.push(...bagianList.filter(bagian => !availableMentionList.includes(bagian.code + " - " + bagian.descrption) && bagian.isActive).map(bagian => `${bagian.code} - ${bagian.descrption}`), ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01" && !availableMentionList.includes(user.username)).map(user => user.username));

      setAvailableForMentionList(availableMentionList);
      setTemporaryJobRegStatus(helpdeskHeader.detailsList.map(details => details.status));
      let isRecipientPic: boolean = false;

      if (auth.scope?.username === helpdeskHeader.dari)
        setMainRole("publisher");
      else if (auth.scope?.username === helpdeskHeader.kepada.concat("-01"))
        setMainRole("recipient");
      else if (helpdeskHeader.ccList.find(cc => [cc.cc.concat("-01"), cc.cc].includes(auth.scope?.username || "")))
        setMainRole(`cc${(helpdeskHeader.ccList.find(cc => [cc.cc.concat("-01"), cc.cc].includes(auth.scope?.username || ""))?.linenum || -1) + 1}`);
      else if (helpdeskHeader.ccList.find(cc => cc.pic === auth.scope?.username))
        setMainRole("ccPic");
      else if (helpdeskHeader.detailsList.find(details => details.pic === auth.scope?.username)) {
        setMainRole("recipientPic");
        setAllowedJobRegToShow(helpdeskHeader.detailsList.filter(details => details.pic === auth.scope?.username));
        isRecipientPic = true;
      }
      else
        showInformationDialog("Not Authorized", "Current account is not authorized to open this Helpdesk. You will be redirected to main page.");

    
      if (mode === "revision") {
        if (helpdeskHeader.status !== "REVISION" || helpdeskHeader.dari !== auth.scope?.username) 
          navigate("/helpdesk/main/all", { replace: true });

        setContext(mode);
        setCurrentRole("publisher");
        setRevisionFromGMG(helpdeskHeader.ccList.find(cc => cc.ac === "REVISION" && cc.cc === "MGMG") !== undefined || (helpdeskHeader.kepada === "MGMG" && helpdeskHeader.ccList.find(cc => cc.ac !== "APPROVE") === undefined));
      } else if (helpdeskHeader.status === "REVISION" && mode === "info") {
        setContext("revision_info");
        setCurrentRole(helpdeskHeader.dari === auth.scope?.username ? "publisher" : auth.scope?.username === publisherDeptHead ? "publisher_dept_head" : "");
        setRevisionFromGMG(helpdeskHeader.ccList.find(cc => cc.ac === "REVISION" && cc.cc === "MGMG") !== undefined || (helpdeskHeader.kepada === "MGMG" && helpdeskHeader.ccList.find(cc => cc.ac !== "APPROVE") === undefined));
      } else if (helpdeskHeader.status === "UNPUBLISHED" && helpdeskHeader.ccList.find(cc => cc.ac !== "APPROVE")) {
        
        const helpdeskCcCurrentIndex = helpdeskHeader.ccList.find(cc => cc.ac !== "APPROVE" && !(helpdeskHeader.ccList.find(cc2 => cc2.linenum < cc.linenum && cc2.ac !== "APPROVE")));
        const requestReviewNoteList = helpdeskHeader.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc");
        const lastRequestReviewMentions = requestReviewNoteList.length > 0 ? requestReviewNoteList[requestReviewNoteList.length - 1].mentions.map(mention => mention.length === 4 ? mention.concat("-01") : mention) : [];

        setContext(`ccFeedback${helpdeskCcCurrentIndex?.linenum}`);
      //  console.log(feedbackCCSupHead)
      //  console.log( "a : " ,helpdeskHeader.ccList.find(d => d.linenum === helpdeskCcCurrentIndex?.linenum)?.cc.concat("-01")) 
        //setCurrentRole([helpdeskCcCurrentIndex?.cc.concat("-01"), helpdeskCcCurrentIndex?.cc].includes(auth.scope?.username) && ["NO ACTION", "REQUESTING REVIEW"].includes(helpdeskCcCurrentIndex?.ac || "") ? "cc" : helpdeskCcCurrentIndex?.ac === auth.scope?.username ? "ccPic" : helpdeskHeader.ccList.find(cc => cc.ac === "REQUESTING REVIEW") && (lastRequestReviewMentions.includes(auth.scope?.username || "")) ? "reviewer" : "");
        
setCurrentRole(
  (
    [helpdeskCcCurrentIndex?.cc.concat("-01"), helpdeskCcCurrentIndex?.cc].includes(auth.scope?.username) &&
    ["NO ACTION", "REQUESTING REVIEW"].includes(helpdeskCcCurrentIndex?.ac || "")
      ? "cc"
      : helpdeskCcCurrentIndex?.ac === auth.scope?.username
        ? "ccPic"
        : helpdeskHeader.ccList.find(cc => cc.ac === "REQUESTING REVIEW") &&
          lastRequestReviewMentions.includes(auth.scope?.username || "")
          ? "reviewer"
          : ""
  ) || (
    helpdeskHeader.ccList.find(d => d.linenum === helpdeskCcCurrentIndex?.linenum)?.cc.concat("-01") === feedbackCCSupHead
      ? "ccPicSup"
      : ""
  )
);
        
        
        setNoteFromGMG(helpdeskCcCurrentIndex?.cc === "MGMG" && helpdeskCcCurrentIndex.ac === "REQUESTING REVIEW");
      
       // console.log("cc feedback: ", helpdeskCcCurrentIndex?.pic )
        if (helpdeskCcCurrentIndex?.pic && helpdeskCcCurrentIndex.pic.length > 0) {
          User.getUserSupHead(helpdeskCcCurrentIndex.pic)
          .then(username => {
        //    console.log("Fetched Sup head:", username);
            setfeedbackCCSupHead(username);
          })
          .catch(() => setfeedbackCCSupHead(""));
        } else {
          setfeedbackCCSupHead("");
        }

      } else if (helpdeskHeader.status === "PUBLISHED") {
        setContext("recipientFeedback");
        setCurrentRole(helpdeskHeader.kepada.concat("-01") === auth.scope?.username ? "recipient" : helpdeskHeader.detailsList.find(details => details.pic === auth.scope?.username && details.status === "WAITING") !== undefined ? "recipientPic" : helpdeskHeader.dari === auth.scope?.username ? "publisher" : "");
      } else if (helpdeskHeader.status === "DONE" && new Date().getTime() - helpdeskHeader.tanggalSelesai.getTime() < 30 * 24 * 60 * 60 * 1000) {
        setContext("doneCanReopen");
      } else {
        setContext(helpdeskHeader.status);
      }

      if (!isRecipientPic)
        setAllowedJobRegToShow(helpdeskHeader.detailsList);

      currentRole.length > 0 && (!["revision", "revision_info"].includes(context) || (context === "revision_info" && revisionFromGMG && currentRole === "publisher_dept_head") || (context === "revision" && (!revisionFromGMG || (revisionFromGMG && auth.scope?.username === publisherDeptHead))))
    }
      
  }, [helpdeskHeader,feedbackCCSupHead]);


    useEffect(() => {
   /*     console.log("context current role change")
       console.log("=== useEffect Triggered ===");
      console.log("context:", context);
      console.log("currentRole:", currentRole);
      console.log("publisherDeptHead:", publisherDeptHead);
      console.log("current user: " ,auth.scope?.username)   */

      if (context.substring(0, 10) === "ccFeedback" && feedbackCCSupHead === auth.scope?.username) {
        setCommentEnabled(true);
        return;
      }
   
      if (currentRole.length > 0 && currentRole !== "recipientPic") {
        if (["revision", "revision_info"].includes(context))
          setCommentEnabled((context === "revision_info" && revisionFromGMG && currentRole === "publisher_dept_head") || (context === "revision" && (!revisionFromGMG || (revisionFromGMG && auth.scope?.username === publisherDeptHead))));
        else if (context === "reviewer" && noteFromGMG)
          setCommentEnabled(auth.scope?.superior.substring(0, 4) === "MGMG" || auth.scope?.lvl === "MGR");
        else
          setCommentEnabled(true);
      } else {
        setCommentEnabled(false);
      }
    }, [context, currentRole]);
  
  return (
    <motion.div
      className="w-full overflow-auto"
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="w-full flex flex-col mx-auto px-3 py-5 mb-10 space-y-5 overflow-hidden select-none xl:w-7xl">
        <h1 className="text-3xl font-semibold">{context === "create" ? "Create New Helpdesk" : context === "revision" ? "Revise Helpdesk" : "Helpdesk Overview"}</h1>
        {
          isLoading ?
          <div className="mx-auto my-10">
            <Loader2 className="mx-auto animate-spin text-red-500" size={40} />
            <p className="mt-3 text-sm">Loading, please wait...</p>
          </div>
          :
          isError ?
          <div className="flex flex-col mt-10 px-5 space-y-5">
            <span className="self-center text-gray-400"><FontAwesomeIcon icon={faCircleExclamation} size="5x" /></span>
            <p className="self-center text-sm text-center">An error has occured when loading data from server. If the problem persist, please contact ISW.</p>
            <div className="mx-auto w-32 text-sm">
              <ButtonLayout text="Reload" type="outline" colorClass="red-500" onClick={() => loadRequiredData()}/>
            </div>
          </div> 
          :
          <div className="flex flex-col space-y-5">
            <div className="h-full flex flex-col space-y-5 md:flex-row md:space-x-5 md:space-y-0">
              <HelpdeskInfoPanel ref={helpdeskInfoPanelRef} context={context} helpdeskHeader={helpdeskHeader} bagianList={bagianList} setPanelHeight={setHelpdeskInfoPanelHeight} showToast={showToast} />

               <HelpdeskCcListPanel ref={helpdeskCcListPanelRef} context={context} currentRole={currentRole} existingCcList={helpdeskHeader.ccList} bagianList={bagianList} userList={userList} canReject={!temporaryJobRegStatus.find(status => status === "DONE")} isMobileSize={isMobileSize} infoPanelHeight={helpdeskInfoPanelHeight} downloadFile={downloadFile} showToast={showToast} />
           
           
            </div>

            <HelpdeskDetailsListPanel ref={helpdeskDetailsListPanelRef} context={context} currentRole={currentRole} nomor={helpdeskHeader.nomor} kepada={helpdeskHeader.kepada} existingDetailsList={allowedJobRegToShow} orderMasterList={orderMasterList} aktivaMasterList={aktivaMasterList} setTemporaryJobRegStatus={setTemporaryJobRegStatus} isMobileSize={isMobileSize} showToast={showToast} />
                 <HelpdeskFooterPanel ref={helpdeskFooterPanelRef} context={context} existingNoteList={helpdeskHeader.noteList} availableForMentionList={availableForMentionList} bagianList={bagianList} uploadedFile={helpdeskHeader.namaFileKepada.length > 0 ? new File([], helpdeskHeader.namaFileKepada) : undefined} submit={submitClicked} printFAB={printFab} printFSTB={printFstb} canGiveFeedback={currentRole === "recipient" } canComment={commentEnabled || (context.substring(0, 10) === "ccFeedback" && feedbackCCSupHead === auth.scope?.username)} canSubmit={(currentRole.length > 0 && (context !== "revision_info" || (context === "revision_info" && (currentRole === "publisher" || (currentRole === "publisher_dept_head" && revisionFromGMG))))) || (context.substring(0, 10) === "ccFeedback" && feedbackCCSupHead === auth.scope?.username)} canReopen={context === "doneCanReopen" && (["publisher", "recipient"].includes(mainRole) || mainRole.indexOf("cc") >= 0)} canSetDone={!temporaryJobRegStatus.find(status => status === "WAITING")} canSetRevision={temporaryJobRegStatus.find(status => status === "WAITING") !== undefined && !helpdeskHeader.noteList.find(note => note.comment.substring(0, 6) === "reopen")} canSetReject={!temporaryJobRegStatus.find(status => status === "DONE") && !helpdeskHeader.noteList.find(note => note.comment.substring(0, 6) === "reopen")} canPrintFab={mode === "info" && nomor !== undefined && nomor.length > 0}
           canPrintFstb={mode === "info" && nomor !== undefined && nomor.length > 0 && (auth.scope?.username === helpdeskHeader.dari || auth.scope?.username.substring(0, 4) === helpdeskHeader.kepada) && helpdeskHeader.status === "PUBLISHED"} showToast={showToast} />
          </div>
        }
      </div>
      <InformationDialog open={informationDialogOpen} closeDialog={closeInformationDialog} title={informationDialogTitle} message={informationDialogMessage} blurBackground={true} />
      <ConfirmationDialog open={confirmationDialogOpen} closeDialog={() => setConfirmationDialogOpen(false)} title={confirmationDialogTitle} message={confirmationDialogMessage} confirmationButton={confirmationDialogButton} setResponse={confirmationDialogResponse} />
      <LoadingDialog open={loadingDialogOpen} />
      <ManageHelpdeskSuccessDialog open={successDialogOpen} closePage={closePage} nomor={successDialogNomorHelpdesk} mode={mode || ""} />
    </motion.div>
  );
};
