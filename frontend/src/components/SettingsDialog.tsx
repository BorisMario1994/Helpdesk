import { faArrowLeft, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { ChangePasswordPanel } from "./settings/ChangePasswordPanel";
import { MainSettingsPanel } from "./settings/MainSettingsPanel";
import { MasterListPanel } from "./settings/MasterListPanel";
import { ManageBagianMasterPanel } from "./bagian_master/ManageBagianMasterPanel";
import { ManageHardwareMasterPanel } from "./hardware_master/ManageHardwareMasterPanel";
import { ManageMasterMasalahPkpPanel } from "./pkp_master_masalah/ManageMasterMasalahPkpPanel";
import { ManageOrderMasterPanel } from "./order_master/ManageOrderMasterPanel";
import { ManageUserPanel } from "./user/ManageUserPanel";
import { LogoutConfirmationPanel } from "./LogoutConfirmationPanel";
import BagianMaster from "../models/master/BagianMaster";
import HardwareMaster from "../models/master/HardwareMaster";
import MasterMasalahPkp from "../models/master/MasterMasalahPkp";
import OrderMaster from "../models/master/OrderMaster";
import User from "../models/master/User";
// import AktivaMaster from "../models/AktivaMaster";
// import { ManageAktivaMasterPanel } from "./aktiva_master/ManageAktivaMasterPanel";

type SettingsDialogProps = {
  open: boolean;
  closeDialog: Function;
  setToastMessage: Function;
  setShowToast: Function;
};

export function SettingsDialog({ open, closeDialog, setToastMessage, setShowToast }: SettingsDialogProps) {
  const [traversePath, setTraversePath] = useState("settings");
  const [pathMode, setPathMode] = useState("");
  const [pathType, setPathType] = useState("");

  const [selectedUser, setSelectedUser] = useState(new User());
  const [selectedBagianMaster, setSelectedBagianMaster] = useState(new BagianMaster());
  const [selectedOrderMaster, setSelectedOrderMaster] = useState(new OrderMaster());
  const [selectedHardwareMaster, setSelectedHardwareMaster] = useState(new HardwareMaster());
  // const [selectedAktivaMaster, setSelectedAktivaMaster] = useState(new AktivaMaster());
  const [selectedMasterMasalahPkp, setSelectedMasterMasalahPkp] = useState(new MasterMasalahPkp());

  const traverseBack = () => setTraversePath(traversePath.substring(0, traversePath.lastIndexOf(">")));
  const traverseForward = (path: string) => setTraversePath(traversePath.concat(">", path));

  const traverseBackClicked = () => {
    setSelectedUser(new User());
    setSelectedBagianMaster(new BagianMaster());
    setSelectedOrderMaster(new OrderMaster());
    setSelectedHardwareMaster(new HardwareMaster());
    // setSelectedAktivaMaster(new AktivaMaster());
    setSelectedMasterMasalahPkp(new MasterMasalahPkp());
    traverseBack();
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (!open)
      setTraversePath("settings");
  }, [open]);

  useEffect(() => {
    const currentDir = traversePath.substring(traversePath.indexOf(">") >= 0 ? traversePath.lastIndexOf(">") + 1 : 0);
    if (currentDir.indexOf("|") >= 0) {
      let currentDirSplit = currentDir.split("|");
      setPathMode(currentDirSplit[0]);
      setPathType(currentDirSplit[1]);
    } else {
      setPathMode(currentDir);
    }
  }, [traversePath]);

  return (
    <Dialog open={open} className="relative z-10 focus:outline-none" onClose={() => {}}>
      <DialogBackdrop transition className="fixed inset-0 bg-black/30 duration-100 ease-out data-[closed]:opacity-0" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className="w-10/12 max-w-lg rounded-xl py-3 bg-white backdrop-blur-2xl duration-100 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
            <DialogTitle className="text-base/7 font-medium mx-3 px-2">
              <div className="flex justify-between">
                <span className={traversePath.indexOf(">") === -1 || pathMode === "logout" ? "hidden" : "text-red-400 cursor-pointer"} onClick={traverseBackClicked}><FontAwesomeIcon icon={faArrowLeft}/></span>
                <p className="text-lg font-semibold text-red-500">
                  {
                    pathMode === "changePassword" ? "Change Password" : 
                    pathMode === "master" ? ((pathType === "MasterMasalahPkp" ? "Master Masalah PKP" : pathType === "DivisionDepartmentMaster" ? "Division / Department Master" : pathType.indexOf("Master") > -1 ? (pathType.substring(0, pathType.indexOf("Master")) + " " + pathType.substring(pathType.indexOf("Master"))) : pathType) + " List") :
                    pathMode === "add" ? ("Create " + (pathType === "MasterMasalahPkp" ? "Master Masalah PKP" : pathType === "DivisionDepartmentMaster" ? "Division / Department Master" : pathType.indexOf("Master") > -1 ? (pathType.substring(0, pathType.indexOf("Master")) + " " + pathType.substring(pathType.indexOf("Master"))) : pathType) + " Data") :
                    pathMode === "edit" ? ("Edit " + (pathType === "MasterMasalahPkp" ? "Master Masalah PKP" : pathType === "DivisionDepartmentMaster" ? "Division / Department Master" : pathType.indexOf("Master") > -1 ? (pathType.substring(0, pathType.indexOf("Master")) + " " + pathType.substring(pathType.indexOf("Master"))) : pathType) + " Data") :
                    pathMode === "logout" ? "Log Out from Account" :
                    "Settings"
                  }
                </p>
                <CloseButton as={Button}><span className="text-red-400 cursor-pointer" onClick={() => pathMode === "logout" ? traverseBack() : closeDialog()}><FontAwesomeIcon icon={faClose}/></span></CloseButton>
              </div>
            </DialogTitle>
            <hr className="mt-3 mx-2 border-t-2 border-t-red-200" />
            <div className="px-5 my-3">
              {
                pathMode === "changePassword" ? <ChangePasswordPanel traverseBack={traverseBack} showToast={showToast} /> :
                pathMode === "master" ? <MasterListPanel type={pathType} traverseForward={traverseForward} setSelectedUser={setSelectedUser} setSelectedBagian={setSelectedBagianMaster} setSelectedOrderMaster={setSelectedOrderMaster} setSelectedHardwareMaster={setSelectedHardwareMaster} /* setSelectedAktivaMaster={setSelectedAktivaMaster} */ setSelectedMasterMasalahPkp={setSelectedMasterMasalahPkp} showToast={showToast} /> :
                ["add", "edit"].includes(pathMode) && pathType === "User" ? <ManageUserPanel mode={pathMode} user={pathMode === "add" ? new User() : selectedUser} traverseBack={traverseBack} showToast={showToast} /> :
                ["add", "edit"].includes(pathMode) && pathType === "DivisionDepartmentMaster" ? <ManageBagianMasterPanel mode={pathMode} bagianMaster={pathMode === "add" ? new BagianMaster() : selectedBagianMaster} traverseBack={traverseBack} showToast={showToast} /> :
                ["add", "edit"].includes(pathMode) && pathType === "OrderMaster" ? <ManageOrderMasterPanel mode={pathMode} orderMaster={pathMode === "add" ? new OrderMaster() : selectedOrderMaster} traverseBack={traverseBack} showToast={showToast} /> :
                ["add", "edit"].includes(pathMode) && pathType === "HardwareMaster" ? <ManageHardwareMasterPanel mode={pathMode} hardwareMaster={pathMode === "add" ? new HardwareMaster() : selectedHardwareMaster} traverseBack={traverseBack} showToast={showToast} /> :
                /*
                ["add", "edit"].includes(pathMode) && pathType === "AktivaMaster" ? <ManageAktivaMasterPanel mode={pathMode} aktivaMaster={pathMode === "add" ? new AktivaMaster() : selectedAktivaMaster} traverseBack={traverseBack} showToast={showToast} /> :
                */
                ["add", "edit"].includes(pathMode) && pathType === "MasterMasalahPkp" ? <ManageMasterMasalahPkpPanel mode={pathMode} masterMasalahPkp={pathMode === "add" ? new MasterMasalahPkp() : selectedMasterMasalahPkp} traverseBack={traverseBack} showToast={showToast} /> :
                pathMode === "logout" ? <LogoutConfirmationPanel traverseBack={traverseBack} />
                : <MainSettingsPanel traverseForward={traverseForward} />
              }
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

