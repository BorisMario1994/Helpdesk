import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import { InformationDialog } from "../dialogs/InformationDialog";
import { LoadingDialog } from "../dialogs/LoadingDialog";
import { ButtonLayout } from "../common/ButtonLayout";
import BagianMaster from "../../models/master/BagianMaster";
import Notes from "../../models/common/Notes";
import User from "../../models/master/User";
import BPMaster from "../../models/master/BPMaster";
import BpbInfoPanel, { BpbInfoPanelRef } from "./BpbInfoPanel";
import BpbDetailsListPanel, { BpbDetailsListPanelRef } from "./BpbDetailsListPanel";
import BpbCcListPanel, { BpbCcListPanelRef } from "./BpbCcListPanel";
import BpbFooterPanel, { BpbFooterPanelRef } from "./BpbFooterPanel";
import BpbHeader from "../../models/bpb/BpbHeader";
import { ManageBpbSuccessDialog } from "./ManageBpbSuccessDialog";

type PageContext = {
  isMobileSize: boolean;
  setShowToast: Function; 
  setToastMessage: Function;
};

export function ManageBpbPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { mode, nomor } = useParams<{ mode: string, nomor?: string }>();
  const { isMobileSize, setShowToast, setToastMessage } = useOutletContext<PageContext>();

  const [bpbHeader, setBpbHeader] = useState(new BpbHeader("", "", "", "", "", new Date()));
  const [bpList, setBPList] = useState<BPMaster[]>([]);
  const [bagianList, setBagianList] = useState<BagianMaster[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [publisherDeptHead, setPublisherDeptHead] = useState("");
  
  const bpbInfoPanelRef = useRef<BpbInfoPanelRef>(null);
  const bpbDetailsListPanelRef = useRef<BpbDetailsListPanelRef>(null);
  const bpbCcListPanelRef = useRef<BpbCcListPanelRef>(null);
  const bpbFooterPanelRef = useRef<BpbFooterPanelRef>(null);
  
  const [context, setContext] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [revisionFromGMG, setRevisionFromGMG] = useState(false);
  const [noteFromGMG, setNoteFromGMG] = useState(false);
  const [availableForMentionList, setAvailableForMentionList] = useState<string[]>([]);
  const [commentEnabled, setCommentEnabled] = useState(false);

  const [bpbInfoPanelHeight, setBpbInfoPanelHeight] = useState(0);
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

  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDialogNomorBpb, setSuccessDialogNomorBpb] = useState("");
  
  const loadRequiredData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      if (!auth.accessToken)
        await auth.refresh();
  
      setUserList(await User.getUserListAdjustedSuperior());
      setBagianList(await BagianMaster.getBagianMasterList());
      setBPList(await BPMaster.getBPMasterList());

      if (nomor) {
        let newBpb = await BpbHeader.getBpbByNumber(nomor);
        setPublisherDeptHead(await User.getUserDeptHead(newBpb.dari));
        setBpbHeader(newBpb);
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

  const showInformationDialog = (title: string, message: string) => {
    setInformationDialogTitle(title);
    setInformationDialogMessage(message);
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
    navigate("/bpb/main/all", { replace: true });
  };

  const downloadFile = async (fileName: string) => {
    try {
      await bpbHeader.downloadFile(fileName);
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
    showConfirmationDialog("revisionDone", "Revise BPB", "Finish revising this BPB? (Future changes are still allowed if revision process hasn't finish)", "YesNo");
  };

  const mentionCheckingAndConfirmation = (type: string) => {
    switch(type) {
      case "mentionedUserNeedsToBeAddedToCcList":
        showConfirmationDialog("mentionedUserNeedsToBeAddedToCcList", "Additional Approval Required", "One or more mention(s) is not registered as Approver in the approver list. Add those mentioned division(s) / department(s) to approval list?", "YesNo");
        break;
      case "continueByIgnoringMentioned":
        showConfirmationDialog("continueByIgnoringMentioned", "Continue to Process BPB", "One or more mentioned division(s) / department(s) are not giving any response on the requested review. Continue to process the BPB?", "YesNo");
        break;
      default:
        break;
    }
  }

  const submitConfirmation = () => {
    let title = "";
    let message = "";
    if (context === "create") {
      title = "Create New BPB";
      message = "Confirm to create this new BPB?";
    } else if (context === "revision") {
      title = "Revise BPB";
      message = "Confirm to revise this BPB?";
    } else if (context === "revision_info") {
      title = "Reply Comment for Revision";
      message = "Replying the comment of this BPB send it back to GMG. Confirm to reply comments for this BPB?";
    } else if (context.substring(0, 10) === "ccFeedback") {
      title = "Update CC Feedback";
      message = "Confirm to give feedback for this BPB?";
    }

    message += " (Make sure all the data are correct and appropriately filled before submitting)";
    showConfirmationDialog("createOrUpdateDone", title, message, "ConfirmCancel");
  };

  const checkSubmittedDataNeedsResetCc = async () => {
    const newBpbHeader = await bpbInfoPanelRef.current!.retrieveInputData();
    newBpbHeader.detailsList = [...bpbDetailsListPanelRef.current!.retrieveDetailsListData()];
    newBpbHeader.ccList = [...bpbCcListPanelRef.current!.retriveCcListData()];

    let detailsChanged = false;
    if (newBpbHeader.detailsList.length !== bpbHeader.detailsList.length) 
      detailsChanged = true;
    else {
      newBpbHeader.detailsList.forEach(details => {
        let index = details.linenum;
        if (details.nama !== bpbHeader.detailsList[index].nama || details.qty !== bpbHeader.detailsList[index].qty || details.satuan !== bpbHeader.detailsList[index].satuan || details.wajibKembali !== bpbHeader.detailsList[index].wajibKembali || details.tsKembali.getTime() !== bpbHeader.detailsList[index].tsKembali.getTime())
          detailsChanged = true;
      });
    }
    return (newBpbHeader.cardCode !== bpbHeader.cardCode || newBpbHeader.kepada !== bpbHeader.kepada || newBpbHeader.keterangan !== bpbHeader.keterangan || newBpbHeader.ref !== bpbHeader.ref || (newBpbHeader.file.size <= 0 && newBpbHeader.file.name !== bpbHeader.namaFile) || (newBpbHeader.file.size > 0 && await newBpbHeader.hashUploadedFile() !== bpbHeader.hashedFile) || detailsChanged) && newBpbHeader.ccList.find(cc => cc.ac === "APPROVE");
  };

  const submitClicked = async () => {
    if (context === "revision_info" && bpbHeader.status === "REVISION" && bpbHeader.dari === auth.scope?.username) {
      navigate(`/bpb/revision/${bpbHeader.nomor}`);
      return;
    } 

    if (["create", "revision"].includes(context) && (!bpbInfoPanelRef.current!.validateInputData() || !bpbDetailsListPanelRef.current!.validateDetailsListData() || !bpbCcListPanelRef.current!.validateCcListData() || !bpbFooterPanelRef.current!.validateFooterData()))
      return;

    else if (context === "revision_info" && (!bpbFooterPanelRef.current!.validateFooterData() || !bpbFooterPanelRef.current!.checkReplyMessageExist())) 
      return;

    else if (context.substring(0, 10) === "ccFeedback" && currentRole === "cc") {
      const updatedCc = bpbCcListPanelRef.current!.retriveUpdatedCcData();
      const footerData = bpbFooterPanelRef.current!.retrieveFooterData();
      
      if ((["REVISION", "REJECT", "REQUESTING REVIEW"].includes(updatedCc.ac) || (bpbHeader.ccList.find(cc => cc.cc === "MGMG" && cc.ac === "REQUESTING REVIEW") && bpbHeader.noteList.filter(note => note.comment.indexOf("requesting_review") >= 0).pop()?.mentions.includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.superior.substring(0, 4) === "MGMG")) && footerData.message.length <= 0) {
        showToast("Please add a comment.");
        return;
      } else if (updatedCc.ac !== "REQUESTING REVIEW" && footerData.mentions.length > 0) {
        showToast("Mentioning must be with 'REQUESTING REVIEW' feedback.");
        return;
      } else if (updatedCc.ac === "REQUESTING REVIEW") {
        if (!footerData.mentions.find(mention => availableForMentionList.includes(mention) || availableForMentionList.includes(mention.concat(" - ", bagianList.find(bagian => bagian.code === mention)?.descrption || "")))) {
          showToast("No valid mention exists. Cannot proceed to update the BPB.");
          return;
        } else if (bpbHeader.ccList.find(cc => cc.ac === "REQUESTING REVIEW")) {
          showToast("Cannot stack 'REQUESTING REVIEW' feedback.");
          return;
        } else if (auth.scope?.username === "MGMG-01" && !bpbHeader.ccList.find(cc => footerData.mentions.includes(cc.cc)) && !mentionedUserNeedsToBeAddedToCcListConfirmationRef.current) {
          mentionCheckingAndConfirmation("mentionedUserNeedsToBeAddedToCcList");
          return;
        }
      } else if (updatedCc.ac !== "REQUESTING REVIEW" && bpbHeader.ccList.find(cc => cc.linenum === updatedCc.linenum)?.ac === "REQUESTING REVIEW" && !continueByIgnoringMentionedRef.current) {
        mentionCheckingAndConfirmation("continueByIgnoringMentioned");
        return;
      }
    }

    else if (context.substring(0, 10) === "ccFeedback" && currentRole === "reviewer" && !bpbFooterPanelRef.current!.checkReplyMessageExist())
      return;

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
          showConfirmationDialog("resetCc", "Revise BPB", "Changes on title, attachment, or Job Registration will reset all approval back to first Approver. Confirm to revise this BPB and reset its approval process?", "ConfirmCancel");
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
        await createOrUpdateBpbHeader();
      else if (context === "revision_info")
        await updateBpbFromDeptHead();
      else if (context.substring(0, 10) === "ccFeedback" && ["cc", "ccPic"].includes(currentRole))
        await updateCcFeedback();
      else if (context.substring(0, 10) === "ccFeedback" && currentRole === "reviewer") 
        await replyForReview();

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
          showToast("An error has occured when creating / updating BPB data. If the problem persist, please contact ISW.");
          break;
      }
    } finally {
      setLoadingDialogOpen(false);
    }
  };

  const createOrUpdateBpbHeader = async () => {
    const newBpbHeader = await bpbInfoPanelRef.current!.retrieveInputData();
    newBpbHeader.detailsList = [...bpbDetailsListPanelRef.current!.retrieveDetailsListData()];
    newBpbHeader.ccList = [...bpbCcListPanelRef.current!.retriveCcListData()];
    if (newBpbHeader.ccList.length <= 0) {
      newBpbHeader.status = "DONE";
      newBpbHeader.tanggalSelesai = new Date();
    }
    const footerData = bpbFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);

    if (context === "create") {
      newBpbHeader.nomor = await newBpbHeader.createBpb();
      setSuccessDialogNomorBpb(newBpbHeader.nomor);
    } else if (context === "revision") {
      if (await checkSubmittedDataNeedsResetCc()) {
        newBpbHeader.ccList.map(cc => {
          cc.ac = "NO ACTION";
          return cc;
        });
      }

      if (revisionDoneConfirmation) {
        if (!newBpbHeader.ccList.find(cc => cc.ac !== "APPROVE")) {
          newBpbHeader.status = "DONE";
          newBpbHeader.tanggalSelesai = new Date();
        } else {
          newBpbHeader.status = "UNPUBLISHED";
          const revisionCc = newBpbHeader.ccList.find(cc => cc.ac === "REVISION");
          if (revisionCc)
            revisionCc.ac = "NO ACTION";
        }
      }

      await newBpbHeader.reviseBpb(note);
      setSuccessDialogNomorBpb(newBpbHeader.nomor);
    } 
  };

  const updateBpbFromDeptHead = async () => {
    const footerData = bpbFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    return bpbHeader.reviseBpbFromDeptHead(note);
  };

  const updateCcFeedback = async () => {
    const updatedCc = bpbCcListPanelRef.current!.retriveUpdatedCcData();
    const footerData = bpbFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    if (currentRole === "ccPic")
      updatedCc.ac = "NO ACTION";
    
    return updatedCc.updateCcData(bpbHeader.nomor, note);
  };

  const replyForReview = async () => {
    const footerData = bpbFooterPanelRef.current!.retrieveFooterData();
    const note = new Notes(-1, new Date(), auth.scope?.username, footerData.message, footerData.mentions);
    return bpbHeader.replyForReview(note);
  }

  const printFab = async () => {
    window.open(`http://192.168.52.34/REPORTS/report/Data%20Sources/REPORT/HELPDESK?rs:Command=Render&NOMOR=${bpbHeader.nomor}`, "_blank");
  };

  const printFstb = async () => {
    window.open(`http://192.168.52.34/REPORTS/report/Data%20Sources/REPORT/FSTB?rs:Command=Render&NOMOR=${bpbHeader.nomor}`, "_blank");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const closePage = () => {
    setSuccessDialogOpen(false);
    navigate("/bpb/main/created", { replace: true });
  };

  useEffect(() => {
    loadRequiredData();
  }, [mode]);

  useEffect(() => {
    if (mode === "create") {
      setContext("create");
      setCurrentRole("publisher");
    } else {
      if (bpbHeader.nomor.length <= 0)
        return;

      const availableMentionList = [...bpbHeader.ccList.map(cc => `${cc.cc}${!bagianList.find(bagian => bagian.code === cc.cc) ? "" : (" - " + bagianList.find(bagian => bagian.code === cc.cc)?.descrption)}`)];
      if (auth.scope?.username === "MGMG-01")
        availableMentionList.push(...bagianList.filter(bagian => !availableMentionList.includes(bagian.code + " - " + bagian.descrption) && bagian.isActive).map(bagian => `${bagian.code} - ${bagian.descrption}`), ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01" && !availableMentionList.includes(user.username)).map(user => user.username));

      setAvailableForMentionList(availableMentionList);

      if (auth.scope?.username !== bpbHeader.dari && !bpbHeader.ccList.find(cc => [cc.cc.concat("-01"), cc.cc].includes(auth.scope?.username || "")) && !bpbHeader.ccList.find(cc => cc.pic === auth.scope?.username))
        showInformationDialog("Not Authorized", "Current account is not authorized to open this BPB. You will be redirected to main page.");


      if (mode === "revision") {
        if (bpbHeader.status !== "REVISION" || bpbHeader.dari !== auth.scope?.username) 
          navigate("/bpb/main/all", { replace: true });

        setContext(mode);
        setCurrentRole("publisher");
        setRevisionFromGMG(bpbHeader.ccList.find(cc => cc.ac === "REVISION" && cc.cc === "MGMG") !== undefined || (bpbHeader.kepada === "MGMG" && bpbHeader.ccList.find(cc => cc.ac !== "APPROVE") === undefined));
      } else if (bpbHeader.status === "REVISION" && mode === "info") {
        setContext("revision_info");
        setCurrentRole(bpbHeader.dari === auth.scope?.username ? "publisher" : auth.scope?.username === publisherDeptHead ? "publisher_dept_head" : "");
        setRevisionFromGMG(bpbHeader.ccList.find(cc => cc.ac === "REVISION" && cc.cc === "MGMG") !== undefined || (bpbHeader.kepada === "MGMG" && bpbHeader.ccList.find(cc => cc.ac !== "APPROVE") === undefined));
      } else if (bpbHeader.status === "UNPUBLISHED" && bpbHeader.ccList.find(cc => cc.ac !== "APPROVE")) {
        const bpbCcCurrentIndex = bpbHeader.ccList.find(cc => cc.ac !== "APPROVE" && !(bpbHeader.ccList.find(cc2 => cc2.linenum < cc.linenum && cc2.ac !== "APPROVE")));
        const requestReviewNoteList = bpbHeader.noteList.filter(note => note.comment.substring(0, 20) === "requesting_review_cc");
        const lastRequestReviewMentions = requestReviewNoteList.length > 0 ? requestReviewNoteList[requestReviewNoteList.length - 1].mentions.map(mention => mention.length === 4 ? mention.concat("-01") : mention) : [];

        setContext(`ccFeedback${bpbCcCurrentIndex?.linenum}`);
        setCurrentRole([bpbCcCurrentIndex?.cc.concat("-01"), bpbCcCurrentIndex?.cc].includes(auth.scope?.username) && ["NO ACTION", "REQUESTING REVIEW"].includes(bpbCcCurrentIndex?.ac || "") ? "cc" : bpbCcCurrentIndex?.ac === auth.scope?.username ? "ccPic" : bpbHeader.ccList.find(cc => cc.ac === "REQUESTING REVIEW") && (lastRequestReviewMentions.includes(auth.scope?.username || "")) ? "reviewer" : "");
        setNoteFromGMG(bpbCcCurrentIndex?.cc === "MGMG" && bpbCcCurrentIndex.ac === "REQUESTING REVIEW");

      } else {
        setContext(bpbHeader.status);
      }

      currentRole.length > 0 && (!["revision", "revision_info"].includes(context) || (context === "revision_info" && revisionFromGMG && currentRole === "publisher_dept_head") || (context === "revision" && (!revisionFromGMG || (revisionFromGMG && auth.scope?.username === publisherDeptHead))))
    }
  }, [bpbHeader]);

  useEffect(() => {
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
        <h1 className="text-3xl font-semibold">{context === "create" ? "Create New BPB" : context === "revision" ? "Revise BPB" : "BPB Overview"}</h1>
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
              <BpbInfoPanel ref={bpbInfoPanelRef} context={context} bpbHeader={bpbHeader} bpList={bpList} setPanelHeight={setBpbInfoPanelHeight} showToast={showToast} />

              <BpbCcListPanel ref={bpbCcListPanelRef} context={context} currentRole={currentRole} existingCcList={bpbHeader.ccList} bagianList={bagianList} userList={userList} canReject={true} isMobileSize={isMobileSize} infoPanelHeight={bpbInfoPanelHeight} downloadFile={downloadFile} showToast={showToast} />
            </div>

            <div className={`flex ${["create","revision"].includes(context) || isMobileSize ? "flex-col space-y-5" : "flex-row space-x-5"}`}>
              <BpbDetailsListPanel ref={bpbDetailsListPanelRef} context={context} existingDetailsList={bpbHeader.detailsList} showToast={showToast} />

              <BpbFooterPanel ref={bpbFooterPanelRef} context={context} existingNoteList={bpbHeader.noteList} availableForMentionList={availableForMentionList} bagianList={bagianList} submit={submitClicked} printFAB={printFab} printFSTB={printFstb} canComment={commentEnabled} canSubmit={currentRole.length > 0 && (context !== "revision_info" || (context === "revision_info" && (currentRole === "publisher" || (currentRole === "publisher_dept_head" && revisionFromGMG))))} canPrintFab={mode === "info" && nomor !== undefined && nomor.length > 0} showToast={showToast} />

            </div>
          </div>
        }
      </div>
      <InformationDialog open={informationDialogOpen} closeDialog={closeInformationDialog} title={informationDialogTitle} message={informationDialogMessage} blurBackground={true} />
      <ConfirmationDialog open={confirmationDialogOpen} closeDialog={() => setConfirmationDialogOpen(false)} title={confirmationDialogTitle} message={confirmationDialogMessage} confirmationButton={confirmationDialogButton} setResponse={confirmationDialogResponse} />
      <LoadingDialog open={loadingDialogOpen} />
      <ManageBpbSuccessDialog open={successDialogOpen} closePage={closePage} nomor={successDialogNomorBpb} mode={mode || ""} />
    </motion.div>
  );
};
