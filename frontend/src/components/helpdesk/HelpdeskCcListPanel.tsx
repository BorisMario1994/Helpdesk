import { Fieldset, Legend } from "@headlessui/react";
import { forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { HelpdeskCcLayout } from "./HelpdeskCcLayout";
import BagianMaster from "../../models/master/BagianMaster";
import HelpdeskCc from "../../models/helpdesk/HelpdeskCc";
import User from "../../models/master/User";
import emptyBox from "../../assets/empty-box.svg";

export type HelpdeskCcListPanelRef = {
  validateCcListData: () => boolean;
  retriveCcListData: () => HelpdeskCc[];
  retriveUpdatedCcData: () => HelpdeskCc;
};

type HelpdeskCcListPanelProps = {
  context: string;
  currentRole: string;
  existingCcList: HelpdeskCc[];
  bagianList: BagianMaster[];
  userList: User[];
  canReject?: boolean;
  isMobileSize: boolean;
  infoPanelHeight: number;
  downloadFile?: (fileName: string) => Promise<void>;
  showToast: (message: string) => void;
};

const HelpdeskCcListPanel = forwardRef<HelpdeskCcListPanelRef, HelpdeskCcListPanelProps>(({ context, currentRole, existingCcList, bagianList, userList, canReject = false, isMobileSize, infoPanelHeight, downloadFile, showToast } : HelpdeskCcListPanelProps, ref) => {
  const auth = useAuth();
  const [newCcList, setNewCcList] = useState<HelpdeskCc[]>([]);
  const [predefinedCcList, setPredefinedCcList] = useState<HelpdeskCc[]>([...existingCcList]);
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
    updatedCcList.push(new HelpdeskCc(predefinedCcList.length + newCcList.length, "", "NO ACTION"));
    setNewCcList(updatedCcList);
  };

  const updatePredefinedCc = (linenum: number, cc: HelpdeskCc) => {
    const prevPredefCc = predefinedCcList.find(predefCc => predefCc.linenum === linenum);
    const newBagianCc = cc.cc.split(" - ")[0];
    if (prevPredefCc?.cc.split(" - ")[0] !== newBagianCc) {
      const prevExistCc = existingCcList.find(existCc => existCc.linenum === linenum);
      cc.ac = (prevExistCc?.cc === newBagianCc) ? prevExistCc.ac : "NO ACTION";
      cc.tanggalAc = (prevExistCc?.cc === newBagianCc) ? prevExistCc.tanggalAc : new Date("1900-01-01");
      cc.pic = (prevExistCc?.cc === newBagianCc) ? prevExistCc.pic : "";
      cc.file = (prevExistCc?.cc === newBagianCc) ? prevExistCc.file : new File([], "");
      cc.namaFile = (prevExistCc?.cc === newBagianCc) ? prevExistCc.namaFile : "";
    } 

    setPredefinedCcList(prev => prev.map(oldCc => oldCc.linenum === linenum ? cc : oldCc));
  };

  const updateNewCc = (linenum: number, cc: HelpdeskCc) => {
    setNewCcList(prev => prev.map(oldCc => oldCc.linenum === linenum ? cc : oldCc));
  };

  const removePredefinedCc = (linenum: number) => {
    const updatedPredefinedCcList = [...predefinedCcList];
    updatedPredefinedCcList.splice(linenum, 1);
    updatedPredefinedCcList.forEach((cc, index) => cc.linenum = index);
    setPredefinedCcList(updatedPredefinedCcList);

    const updatedNewCcList = [...newCcList];
    updatedNewCcList.forEach((cc, index) => cc.linenum = updatedPredefinedCcList.length + index);
    setNewCcList(updatedNewCcList);
  };

  const removeNewCc = (linenum: number) => {
    const updatedCcList = [...newCcList];
    updatedCcList.splice(linenum - predefinedCcList.length, 1);
    updatedCcList.forEach((cc, index) => cc.linenum = predefinedCcList.length + index);
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

      const newCc = new HelpdeskCc(0, `${requiredCc} - ${(bagianList.find(bagian => bagian.code === requiredCc)?.descrption || "")}`, "NO ACTION");
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

        if (![...predefinedCcList, ...newCcList].find(cc => cc.cc.substring(0, 4) === requiredCc && cc.linenum < ccGmgLinenum)) {
          showToast("Please add the highest superior of current user's Div / Dept to approval list if MGMG is included.");
          return false;
        }
      }
      return true;
    },
    retriveCcListData: () => {
      const updatedCcList = [...(predefinedCcList.map(cc => { cc.cc = cc.cc.split(" - ")[0]; return cc; })), ...(newCcList.map(cc => { cc.cc = cc.cc.split(" - ")[0]; return cc; }))];
      return updatedCcList;
    },
    retriveUpdatedCcData: () => {
      const linenum = Number(context.substring(10));
      const ccData = predefinedCcList[linenum];
      const updatedCc = new HelpdeskCc(ccData.linenum, ccData.cc.split(" - ")[0], ccData.ac, ccData.ac !== existingCcList[linenum].ac ? new Date() : ccData.tanggalAc, !["APPROVE", "REVISION", "REJECT", "NO ACTION", "REQUESTING REVIEW"].includes(ccData.ac) ? ccData.ac : ccData.pic, ccData.file, ccData.namaFile);
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
            predefinedCcList.map(cc => <HelpdeskCcLayout key={cc.linenum} cc={cc} bagianList={[...bagianList, ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01").map(user => new BagianMaster(user.username, "", true))]} setCc={updatePredefinedCc} removeCc={removePredefinedCc} downloadFile={downloadFile} canGiveFeedback={context === `ccFeedback${cc.linenum}` && currentRole === "cc"} canUpdate={context === `ccFeedback${cc.linenum}` && ["cc", "ccPic"].includes(currentRole)} canDelete={context === "revision" && cc.ac !== "APPROVE" && !(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} canReject={canReject} canRequestReview={context === `ccFeedback${cc.linenum}` && ["cc", "ccPic"].includes(currentRole) && !existingCcList.find(findCc => findCc.linenum !== cc.linenum && findCc.ac === "REQUESTING REVIEW")} showToast={showToast} />)
          }
          {
            predefinedCcList.length <= 0 && newCcList.length <= 0 ?
            <div className="flex flex-col space-y-3 my-auto">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm text-center">No approval list added for this helpdesk.</p>
            </div>
            : newCcList.map(cc => <HelpdeskCcLayout key={cc.linenum + cc.cc} cc={cc} bagianList={[...bagianList, ...userList.filter(user => ["MPBL", "SPBL", "MWGM", "MSSA", "JPJL"].includes(user.username.substring(0, 4)) && user.username.substring(4) !== "-01").map(user => new BagianMaster(user.username, "", true))]} existing={false} setCc={updateNewCc} removeCc={removeNewCc} canUpdate={!(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} canDelete={!(cc.linenum === 0 && (auth.scope?.lvl.length || 0) <= 0)} /> )
          }
        </div>
      </div>
    </Fieldset>
  );
});

export default HelpdeskCcListPanel;
