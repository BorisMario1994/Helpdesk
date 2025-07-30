import { faCircleExclamation, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
// import { AktivaMasterLayout } from "../aktiva_master/AktivaMasterLayout";
import { BagianMasterLayout } from "../bagian_master/BagianMasterLayout";
import { HardwareMasterLayout } from "../hardware_master/HardwareMasterLayout";
import { MasterMasalahPkpLayout } from "../pkp_master_masalah/MasterMasalahPKPLayout";
import { OrderMasterLayout } from "../order_master/OrderMasterLayout";
import { UserLayout } from "../user/UserLayout";
import { ButtonLayout } from "../common/ButtonLayout";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import BagianMaster from "../../models/master/BagianMaster";
import HardwareMaster from "../../models/master/HardwareMaster";
import MasterMasalahPkp from "../../models/master/MasterMasalahPkp";
import OrderMaster from "../../models/master/OrderMaster";
import User from "../../models/master/User";
import emptyBox from "../../assets/empty-box.svg"
// import AktivaMaster from "../../models/AktivaMaster";

type Props = {
  type: string;
  traverseForward: Function;
  setSelectedUser: Function;
  setSelectedBagian: Function;
  setSelectedOrderMaster: Function;
  setSelectedHardwareMaster: Function;
  // setSelectedAktivaMaster: Function;
  setSelectedMasterMasalahPkp: Function;
  showToast: (message: string) => void;
}

export function MasterListPanel({ type, traverseForward, setSelectedUser, setSelectedBagian, setSelectedOrderMaster, setSelectedHardwareMaster, /* setSelectedAktivaMaster, */ setSelectedMasterMasalahPkp, showToast }: Props) {
  const auth = useAuth();
  const navigate = useNavigate();

  const [userList, setUserList] = useState<User[]>([]);
  const [bagianMasterList, setBagianMasterList] = useState<BagianMaster[]>([]);
  const [orderMasterList, setOrderMasterList] = useState<OrderMaster[]>([]);
  const [hardwareMasterList, setHardwareMasterList] = useState<HardwareMaster[]>([]);
  // const [aktivaMasterList, setAktivaMasterList] = useState<AktivaMaster[]>([]);
  const [masterMasalahPkpList, setMasterMasalahPkpList] = useState<MasterMasalahPkp[]>([]);
  const searchInput = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState("");
  const [usernameToResetPassword, setUsernameToResetPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [resetPasswordConfirmationDialogOpen, setResetPasswordConfirmationDialogOpen] = useState(false);

  const getData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      if (type === "User")
        setUserList(await User.getUserList());
      else if (type === "DivisionDepartmentMaster")
        setBagianMasterList(await BagianMaster.getBagianMasterList());
      else if (type === "OrderMaster")
        setOrderMasterList(await OrderMaster.getOrderMasterList());
      else if (type === "HardwareMaster")
        setHardwareMasterList(await HardwareMaster.getHardwareMasterList());
      /*
      else if (type === "AktivaMaster")
        setAktivaMasterList(await AktivaMaster.getAktivaMasterList());
      */
      else if (type === "MasterMasalahPkp")
        setMasterMasalahPkpList(await MasterMasalahPkp.getMasterMasalahPkpList());
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await getData();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          setIsLoading(false);
          setIsError(true);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterSearch = () => {
    if (searchInput.current) 
      setSearchText(searchInput.current.value);
  };

  const openEditMasterData = (obj: any) => {
    if (type === "User")
      setSelectedUser(obj);
    else if (type === "DivisionDepartmentMaster")
      setSelectedBagian(obj);
    else if (type === "OrderMaster")
      setSelectedOrderMaster(obj);
    else if (type === "HardwareMaster")
      setSelectedHardwareMaster(obj);
    /*
    else if (type === "AktivaMaster")
      setSelectedAktivaMaster(obj);
    */
    else if (type === "MasterMasalahPkp")
      setSelectedMasterMasalahPkp(obj);
    traverseForward(`edit|${type}`);
  };

  const resetPasswordConfirmation = (response: boolean) => {
    if (!response) {
      setUsernameToResetPassword("");
      return;
    }
    resetPassword();
  };

  const resetPassword = async () => {
    try {
      setIsLoading(true);
      await User.resetPassword(usernameToResetPassword);
      showToast("User's password has been reset.");
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await resetPassword();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          showToast("An error has occured when resetting user's password. If the problem persist, please contact ISW.");
          break;
      }
    } finally {
      setUsernameToResetPassword("");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (usernameToResetPassword.length <= 0)
      return;
    setResetPasswordConfirmationDialogOpen(true);
  }, [usernameToResetPassword]);

  return (
    <>
      <div className="w-full sticky top-1 start-1 py-2 bg-white">
        <div className="relative">
          <span className="absolute start-3 mt-2 text-gray-400"><FontAwesomeIcon icon={faSearch} /></span>
          <Input ref={searchInput} type="text" className="w-full ps-10 pe-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Search..." onChange={filterSearch} />
        </div>
      </div>
      <div className="h-96 flex flex-col mt-3 pb-10 space-y-3 overflow-y-auto pe-1">
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
              <ButtonLayout text="Reload" type="outline" colorClass="red-500" onClick={getData} />
            </div>
          </div> 
          :
          type === "User" ? 
          (
            userList.length <= 0 || (searchText.length > 0 && userList.find((user) => user.username.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ? 
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{userList.length <= 0 ? "No user was registered on the system." : "User not found."}</p>
            </div> 
            : 
            userList.map((user) => {
              if (user.username.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <UserLayout key={user.username} user={user} openEditUser={openEditMasterData} selectUserToResetPassword={setUsernameToResetPassword} />
            })
          ) : 
          type === "DivisionDepartmentMaster" ? 
          (
            bagianMasterList.length <= 0 || (searchText.length > 0 && bagianMasterList.find((bagian) => bagian.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || bagian.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ?
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{bagianMasterList.length <= 0 ? "No Division / Department was registered on the system." : "Division / Department data not found."}</p>
            </div> 
            : 
            bagianMasterList.map((bagian) => {
              if (bagian.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || bagian.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <BagianMasterLayout key={bagian.code} bagianMaster={bagian} openEditBagianMaster={openEditMasterData} />
            }) 
          ) :
          type === "OrderMaster" ? 
          (
            orderMasterList.length <= 0 || (searchText.length > 0 && orderMasterList.find((order) => order.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || order.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ?
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{orderMasterList.length <= 0 ? "No Order Master was registered on the system." : "Order Master not found."}</p>
            </div> 
            : 
            orderMasterList.map((order) => {
              if (order.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || order.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <OrderMasterLayout key={order.code} orderMaster={order} openEditOrderMaster={openEditMasterData} />
            }) 
          ) :
          type === "HardwareMaster" ? 
          (
            hardwareMasterList.length <= 0 || (searchText.length > 0 && hardwareMasterList.find((hardware) => hardware.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || hardware.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ?
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{hardwareMasterList.length <= 0 ? "No Harware Master was registered on the system." : "Hardware Master not found."}</p>
            </div> 
            : 
            hardwareMasterList.map((hardware) => {
              if (hardware.code.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || hardware.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <HardwareMasterLayout key={hardware.code} hardwareMaster={hardware} openEditHardwareMaster={openEditMasterData} />
            }) 
          ) :
          /*
          type === "AktivaMaster" ? 
          (
            aktivaMasterList.length <= 0 || (searchText.length > 0 && aktivaMasterList.find((aktiva) => aktiva.kodeAktiva.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || aktiva.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ?
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{aktivaMasterList.length <= 0 ? "No Aktiva Master was registered on the system." : "Aktiva Master not found."}</p>
            </div> 
            : 
            aktivaMasterList.map((aktiva) => {
              if (aktiva.kodeAktiva.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || aktiva.descrption.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <AktivaMasterLayout key={aktiva.kodeAktiva} aktivaMaster={aktiva} openEditHardwareMaster={openEditMasterData} />
            }) 
          ) : */
          (
            masterMasalahPkpList.length <= 0 || (searchText.length > 0 && masterMasalahPkpList.find((masterMasalahPkp) => masterMasalahPkp.masalah.toUpperCase().indexOf(searchText.toUpperCase()) > -1) === undefined) ?
            <div className="flex flex-col mt-10 space-y-3">
              <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
              <p className="self-center text-sm">{masterMasalahPkpList.length <= 0 ? "No Master Masalah PKP data registered on the system." : "No data found on Master Masalah PKP."}</p>
            </div> 
            : 
            masterMasalahPkpList.map((masterMasalahPkp) => {
              if (masterMasalahPkp.masalah.toUpperCase().indexOf(searchText.toUpperCase()) > -1)
                return <MasterMasalahPkpLayout key={masterMasalahPkp.code} masterMasalahPkp={masterMasalahPkp} openEditMasterMasalahPkp={openEditMasterData} />
            })
          )
        }
        <Button className="w-12 h-12 bg-red-500 rounded-full absolute bottom-0 right-0 mr-10 mb-7 cursor-pointer data-[hover]:shadow-md data-[hover]:shadow-red-400" onClick={() => traverseForward(`add|${type}`)}>
          <span className="text-white"><FontAwesomeIcon icon={faPlus}/></span>
        </Button>
      </div>
      <ConfirmationDialog open={resetPasswordConfirmationDialogOpen} closeDialog={() => setResetPasswordConfirmationDialogOpen(false)} title="Reset Password" message={`You're about to resetting the password of ${usernameToResetPassword}'s account. Confirm to reset the password?`} setResponse={resetPasswordConfirmation} confirmationButton="ConfirmCancel" />
    </>
  );
};
