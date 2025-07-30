import { Fieldset, Legend } from "@headlessui/react";
import { forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { BpbCcLayout } from "./BpbCcLayout";
import BagianMaster from "../../models/master/BagianMaster";
import User from "../../models/master/User";
import emptyBox from "../../assets/empty-box.svg";
import BpbCc from "../../models/bpb/BpbCc";

export type BpbCcListPanelRef = {
  validateCcListData: () => boolean;
  retriveCcListData: () => BpbCc[];
  retriveUpdatedCcData: () => BpbCc;
};

type BpbCcListPanelProps = {
  context: string;
  currentRole: string;
  existingCcList: BpbCc[];
  bagianList: BagianMaster[];
  userList: User[];
  canReject?: boolean;
  isMobileSize: boolean;
  infoPanelHeight: number;
  downloadFile?: (fileName: string) => Promise<void>;
  showToast: (message: string) => void;
};

const BpbCcListPanel = forwardRef<BpbCcListPanelRef, BpbCcListPanelProps>(({ context, currentRole, existingCcList, bagianList, userList, canReject = false, isMobileSize, infoPanelHeight, downloadFile, showToast } : BpbCcListPanelProps, ref) => {
  const auth = useAuth();
  const [newCcList, setNewCcList] = useState<BpbCc[]>([]);
  const [predefinedCcList, setPredefinedCcList] = useState<BpbCc[]>([...existingCcList]);
  const ccPanel = useRef<HTMLDivElement>(null);
  const [ccPanelMaxHeight, setCcPanelMaxHeight] = useState("0px");

  const addNewCc = () => {
    if (newCcList.length > 0) {
      if (newCcList[newCcList.length - 1].cc.length <= 0) {
        showToast("Cannot add new approver because previous approver has not been set yet.");
        return;
      }
    }

    const updatedCcList = [...newCcList];
    updatedCcList.push(new BpbCc(predefinedCcList.length + newCcList.length, "", "NO ACTION"));
    setNewCcList(updatedCcList);
  };

  const updatePredefinedCc = (linenum: number, cc: BpbCc) => {
    setPredefinedCcList(prev => prev.map(oldCc => oldCc.linenum === linenum ? cc : oldCc));
  };

  const updateNewCc = (linenum: number, cc: BpbCc) => {
    setNewCcList(prev => prev.map(oldCc => oldCc.linenum === linenum ? cc : oldCc));
  };

  const removePredefinedCc = (linenum: number) => {
    const updatedCcList = [...predefinedCcList];
    updatedCcList.splice(linenum, 1);
    updatedCcList.forEach((cc, index) => cc.linenum = index);
    setPredefinedCcList(updatedCcList);
  };

  const removeNewCc = (linenum: number) => {
    const updatedCcList = [...newCcList];
    updatedCcList.splice(linenum - predefinedCcList.length, 1);
    updatedCcList.forEach((cc, index = predefinedCcList.length) => cc.linenum = index);
    setNewCcList(updatedCcList);
  };

  useEffect(() => {
    if (context === "create" && (auth.scope?.lvl.length || 0) <= 0) {
      let currentLvl = auth.scope?.superior.substring(0, 4);
      let requiredCc = "";

      while (currentLvl) {
        let nextLevelBagian = bagianList.find(bagian => bagian.code === currentLvl);
        currentLvl = userList.find(user => user.username === (currentLvl + "-01"))?.superior.substring(0, 4);
        requiredCc = nextLevelBagian?.isActive ? nextLevelBagian.code : requiredCc;
        if (requiredCc.length > 0)
          break;
      }

      const newCc = new BpbCc(0, `${requiredCc} - ${(bagianList.find(bagian => bagian.code === requiredCc)?.descrption || "")}`, "NO ACTION");
      setNewCcList([newCc]);
    }
  }, []);

  useEffect(() => {
    setCcPanelMaxHeight(ccPanel.current && !isMobileSize ? `${infoPanelHeight}px` : `none`);
  }, [isMobileSize, infoPanelHeight, predefinedCcList, newCcList]);

  useImperativeHandle(ref, () => ({
    validateCcListData: () => {
      if (newCcList.find(cc => cc.cc.length <= 0)) {
        showToast("Please delete empty approver.");
        return false;
      } else if (newCcList.find(cc => cc.cc.substring(0, 4) === "MGMG") && auth.scope?.superior.substring(0, 4) !== "MGMG") {
        let ccGmgLinenum = newCcList.find(cc => cc.cc.substring(0, 4) === "MGMG")!.linenum
        let currentLvl = auth.scope?.superior.substring(0, 4);
        let requiredCc = "";

        while (currentLvl && currentLvl !== "MGMG") {
          let nextLevelBagian = bagianList.find(bagian => bagian.code === currentLvl);
          currentLvl = userList.find(user => user.username === (currentLvl + "-01"))?.superior.substring(0, 4);
          requiredCc = nextLevelBagian?.isActive ? nextLevelBagian.code : requiredCc;
        }

        if (!newCcList.find(cc => cc.cc.substring(0, 4) === requiredCc && cc.linenum < ccGmgLinenum)) {
          showToast("Please add the highest superior of current user's Div / Dept to approval list if MGMG is included.");
          return false;
        }
      }
      return true;
    },
    retriveCcListData: () => {
      const updatedCcList = [...predefinedCcList, ...(newCcList.map(cc => { cc.cc = cc.cc.split(" - ")[0]; return cc; }))];
      return updatedCcList;
    },
    retriveUpdatedCcData: () => {
      const linenum = Number(context.substring(10))
      const ccData = predefinedCcList[linenum];
      const updatedCc = new BpbCc(ccData.linenum, ccData.cc, ccData.ac, ccData.ac !== existingCcList[linenum].ac ? new Date() : ccData.tanggalAc, !["APPROVE", "REVISION", "REJECT", "NO ACTION", "REQUESTING REVIEW"].includes(ccData.ac) ? ccData.ac : ccData.pic, ccData.file, ccData.namaFile);
      return updatedCc;
    },
  }));

  return (
    <Fieldset as={Fragment}>
      <div ref={ccPanel} className="flex flex-col shrink-0 border border-gray-300 rounded-md shadow-md md:basis-1/2 md:overflow-x-hidden md:overflow-auto" style={{ maxHeight: ccPanelMaxHeight }}>
        <div className="sticky top-0 flex justify-between items-center z-5 px-5 pt-5 pb-2 bg-white">
          <Legend className="font-semibold">Approval List</Legend>
          <div className={`${["create", "revision"].includes(context) ? "" : "hidden"} text-xs`}>
            <ButtonLayout text="Add Approver" type="outline" colorClass="green-700" onClick={addNewCc} />  
          </div>
        </div>
        <div className="w-full flex flex-col space-y-3 p-5">
          {
            predefinedCcList.map(cc => <BpbCcLayout key={cc.linenum} cc={cc} bagianList={[...bagianList, ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01").map(user => new BagianMaster(user.username, "", true))]} setCc={updatePredefinedCc} removeCc={removePredefinedCc} downloadFile={downloadFile} canGiveFeedback={context === `ccFeedback${cc.linenum}` && currentRole === "cc"} canUpdate={context === `ccFeedback${cc.linenum}` && ["cc", "ccPic"].includes(currentRole)} canDelete={context === "revision" && cc.ac !== "APPROVE" && !(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} canReject={canReject} canRequestReview={context === `ccFeedback${cc.linenum}` && ["cc", "ccPic"].includes(currentRole) && !existingCcList.find(findCc => findCc.linenum !== cc.linenum && findCc.ac === "REQUESTING REVIEW")} showToast={showToast} />)
          }
          {
            predefinedCcList.length <= 0 && newCcList.length <= 0 ?
            <div className="flex flex-col space-y-3 my-auto">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm text-center">No approval list added for this helpdesk.</p>
            </div>
            : newCcList.map(cc => <BpbCcLayout key={cc.linenum + cc.cc} cc={cc} bagianList={[...bagianList, ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01").map(user => new BagianMaster(user.username, "", true))]} existing={false} setCc={updateNewCc} removeCc={removeNewCc} canUpdate={!(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} canDelete={!(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} /> )
          }
        </div>
      </div>
    </Fieldset>
  );
});

export default BpbCcListPanel;
