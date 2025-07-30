import { faBell, faCircleExclamation, faPlus, faSearch, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { CategoriesNavigationPanel } from '../CategoriesNavigationPanel';
import { FiltersPanel } from '../FiltersPanel';
// import { HelpdeskDashboardHeaderPanel } from './HelpdeskDashboardHeaderPanel';
import { HelpdeskHeaderLayout } from './HelpdeskHeaderLayout';
import { ButtonLayout } from '../common/ButtonLayout';
import { InputFieldLayout } from '../common/InputFieldLayout';
import BagianMaster from '../../models/master/BagianMaster';
import HelpdeskHeader from '../../models/helpdesk/HelpdeskHeader';
import User from '../../models/master/User';
import emptyBox from "../../assets/empty-box.svg";


type HelpdeskFilter = {
  dari: Date;
  hingga: Date;
  penerbit: string;
  kepada: string;
  sortBy: string;
};

export function HelpdeskDashboardPage() {
  const { isMobileSize } = useOutletContext<{ isMobileSize: boolean }>();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [userList, setUserList] = useState<User[]>([]);
  const [bagianList, setBagianList] = useState<BagianMaster[]>([]);
  const [helpdeskList, setHelpdeskList] = useState<HelpdeskHeader[]>([]);
  const [notificationList, setNotificationList] = useState<{ tipe: string, jumlah: number }[]>([]);
  const [hasNotification, setHasNotification] = useState(false);

  const searchInput = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [resetFilter, setResetFilter] = useState(false);
  const [filterData, setFilterData] = useState<HelpdeskFilter>({ dari: new Date("dd/MM/yyyy"), hingga: new Date("dd/MM/yyyy"), penerbit: "Select one", kepada: "Select one", sortBy: "Select one" });

  const loadData = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      if (!auth.accessToken) 
        await auth.refresh();

      setUserList(await User.getUserList());
      setBagianList(await BagianMaster.getBagianMasterList());
      setHelpdeskList(await HelpdeskHeader.getHelpdeskList(type || "all"));
      setNotificationList(await HelpdeskHeader.getNotificationList()); // ([]);
      setFilterData({ dari: new Date("dd/MM/yyyy"), hingga: new Date("dd/MM/yyyy"), penerbit: "Select one", kepada: "Select one", sortBy: "Select one" });
      setResetFilter(true);
      setIsLoading(false);
    } catch (err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await loadData();
        case "AuthorizationFailed":
        case "TokenInvalid":
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

  const loadNotification = async () => {
    try {
      setNotificationList(await HelpdeskHeader.getNotificationList());  // ([]);
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await loadNotification();
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

  const deleteNotification = async (nomor: string) => {
    try {
      await HelpdeskHeader.deleteNotification(nomor, auth.scope?.username || "");
      loadNotification();
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await deleteNotification(nomor);
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

  useEffect(() => {
    loadData();
    const refreshNotification = setInterval(async () => {
      await loadNotification();
      setHelpdeskList(await HelpdeskHeader.getHelpdeskList(type || "all"));
    }, 60_000);

    return () => { clearInterval(refreshNotification) };
  }, [type]);

  useEffect(() => {
    setHasNotification(notificationList.find(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)) !== undefined);
  }, [notificationList])

  const filterSearch = () => {
    if (searchInput.current)
      setSearchText(searchInput.current.value);
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col mx-auto mt-3 overflow-x-clip overflow-y-auto md:px-3 xl:w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      { /* <HelpdeskDashboardHeaderPanel notifList={notificationList} /> */ }
      <div className="h-full flex flex-col mt-5 space-y-5 md:flex-row md:space-y-0 md:flex-1 md:overflow-hidden md:mb-5 select-none">
        <CategoriesNavigationPanel type="helpdesk" activeCategory={type || "all"} notifList={notificationList} />
        <div className="relative flex flex-col mt-3 order-last md:h-full md:grow-0 md:basis-5/9 md:order-2 md:mt-0 md:px-5">
          <div className="sticky top-0 space-y-3 px-3 pb-5 bg-white rounded-b-xl md:px-0 md:rounded-b-none md:shadow-none">
            <div className="flex justify-between items-center py-2">
              <p className="text-2xl font-bold">
                {
                  type === "all" ? "All Helpdesk" :
                  type === "created" ? "Created Helpdesk" :
                  type === "unpublished" ? "Unpublished" :
                  type === "approved" ? "Approved" :
                  type === "revision" ? "Revision" :
                  type === "rejected" ? "Rejected" :
                  type === "waiting-for-approval" ? "Waiting for Approval" :
                  type === "waiting-for-review" ? "Waiting for Review" :
                  type === "approval-request" ? "Approval Request" :
                  type === "job-registration" ? "Job Registration" :
                  type === "done" ? "Done Helpdesk" : ""
                }
              </p>
              <div className="flex gap-3">
                <Popover className={`hidden border rounded-full text-red-500 cursor-pointer md:flex ${hasNotification ? "animate-bg-pulse" : ""}`}>
                  <PopoverButton className="flex relative gap-3 items-center m-auto px-3 py-2">
                    <div className={`${!hasNotification && "hidden"} absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full`}></div>
                    <span><FontAwesomeIcon icon={faBell} /></span>
                    <p className="text-sm">Notification</p>
                  </PopoverButton>
                  <PopoverPanel anchor="bottom" transition className="flex flex-col origin-top mt-1 p-2 space-y-1 z-10 border-2 border-red-200 bg-white rounded-lg shadow-md text-sm  transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0">
                    <div className="max-w-96 flex flex-col gap-2">
                      {
                        !hasNotification ?
                        <p className="p-5">There are no notifications for now.</p> :
                        notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).map((notif, index) => 
                          notif.tipe.indexOf("|") > -1 ?
                          <div key={notif.tipe} >
                            <div className="flex justify-between items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-red-100" onDoubleClick={() => navigate(`/helpdesk/info/${notif.tipe.split("|")[0]}`)}>
                              <p className="text-justify">
                                {notif.tipe.split("|")[1] === "revision_done" ? `Revision was done by publisher for Helpdesk number ` : notif.tipe.split("|")[1] === "follow_up" ? "The publisher follows up for the progress of Helpdesk number " : `GMG gave ${notif.tipe.split("|")[1].split("_")[0] === "revision" ? "revision" : "reject"} feedback for Helpdesk number `}<span className="text-red-500 font-semibold">{notif.tipe.split("|")[0]}</span>
                              </p>
                              <div className="self-stretch my-1 border-r-2 border-r-gray-300"></div>
                              <span className="px-2 rounded-full text-center text-lg text-gray-500 font-semibold cursor-pointer hover:bg-red-50 hover:text-red-500" onClick={async () => await deleteNotification(notif.tipe.split("|")[0])}>x</span>
                            </div><hr className={`mx-1 text-gray-400 ${index === notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).length - 1 && "hidden"}`}/>
                          </div> :
                          <div key={notif.tipe} >
                            <p className="px-3 py-2 rounded-md hover:bg-red-100">
                            You have <span className="text-red-500 font-semibold">{notif.jumlah}</span> notification(s) on <span className="text-red-500 font-semibold">{notif.tipe}</span>
                            </p><hr className={`mx-1 text-gray-400 ${index === notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).length - 1 && "hidden"}`}/>
                          </div>
                        )
                      }
                    </div>
                  </PopoverPanel>
                </Popover>  
                <div className="hidden items-center space-x-3 px-3 py-2 bg-red-500 rounded-full shadow shadow-red-200 text-white cursor-pointer md:flex" onClick={() => navigate("/helpdesk/create")}>
                  <span><FontAwesomeIcon icon={faPlus} /></span>
                  <p className="text-sm">Create new Helpdesk</p>
                </div>
              </div>
            </div>
            <InputFieldLayout ref={searchInput} type="text" id="searchInput" placeholder="Search..." onInputChange={filterSearch} prefixIcon={<FontAwesomeIcon icon={faSearch}/>} />
          </div>
          <div className="flex flex-col px-3 pb-15 space-y-5 md:px-0 md:pe-1 md:overflow-y-auto">
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
                <p className="self-center text-sm text-center">An error has occured while loading data from server. Try again later. If the problem persist, please contact ISW.</p>
                <div className="mx-auto w-32 text-sm">
                  <ButtonLayout text="Reload" type="outline" colorClass="red-500" onClick={() => loadData()} />
                </div>
              </div> 
              :
              helpdeskList.length <= 0 || (helpdeskList.find((helpdesk) => (searchText.length <= 0 || (searchText.length > 0 && (helpdesk.nomor.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || helpdesk.title.toUpperCase().indexOf(searchText.toUpperCase()) > -1))) && (filterData.dari.getFullYear() === 1900 || filterData.dari.toString() === "Invalid Date" || helpdesk.tanggalTerbit >= filterData.dari) && (filterData.hingga.getFullYear() === 1900 || filterData.hingga.toString() === "Invalid Date" || helpdesk.tanggalTerbit <= filterData.hingga) && (filterData.penerbit === "Select one" || helpdesk.dari === filterData.penerbit) && (filterData.kepada === "Select one" || helpdesk.kepada == filterData.kepada)) === undefined) ? 
              <div className="flex flex-col mt-10 px-5 space-y-5">
                <span className="self-center"><img className="w-32 h-32" src={emptyBox} alt="EMPTY" /></span>
                <p className="self-center text-sm text-center">{helpdeskList.length <= 0 ? "There are no Helpdesk registered in this category." : "There are no helpdesk matched for the given search criterion."}</p>
              </div> 
              : 
              [...helpdeskList]
              .sort((a, b) => {
                if (filterData.sortBy === "Select one") 
                  return 0;
                else {
                  if (filterData.sortBy === "Number") {
                    if (a.nomor < b.nomor) return -1;
                    if (a.nomor > b.nomor) return 1;
                    return 0;
                  } else if (filterData.sortBy === "Published Date") {
                    return a.tanggalTerbit.getTime() - b.tanggalTerbit.getTime();
                  } else {
                    const statusA = (a.status === "REVISION" ? 0 : a.status === "UNPUBLISHED" ? 1 : a.status === "PUBLISHED" ? 2 : a.status === "DONE" ? 4 : 5);
                    const statusB = (b.status === "REVISION" ? 0 : b.status === "UNPUBLISHED" ? 1 : b.status === "PUBLISHED" ? 2 : b.status === "DONE" ? 4 : 5);
                    return statusA - statusB;
                  }
                }
              })
              .map((helpdesk) => {
                if ((helpdesk.nomor.toUpperCase().indexOf(searchText.toUpperCase()) > -1 || helpdesk.title.toUpperCase().indexOf(searchText.toUpperCase()) > -1) && (filterData.dari.getFullYear() === 1900 || filterData.dari.toString() === "Invalid Date" || helpdesk.tanggalTerbit >= filterData.dari) && (filterData.hingga.getFullYear() === 1900 || filterData.hingga.toString() === "Invalid Date" || helpdesk.tanggalTerbit <= filterData.hingga) && (filterData.penerbit === "Select one" || helpdesk.dari == filterData.penerbit) && (filterData.kepada === "Select one" || helpdesk.kepada == filterData.kepada)) 
                  return <HelpdeskHeaderLayout key={helpdesk.nomor} helpdesk={helpdesk} />
              })
            }
          </div>
        </div>
        <FiltersPanel isMobileSize={isMobileSize} setFilter={setFilterData} filterReset={resetFilter} setFilterReset={setResetFilter} usernameList={userList.map((user) => user.username)} bagianTextList={bagianList.map((bagian) => `${bagian.code} - ${bagian.descrption}`)} />
        <Popover className="absolute bottom-12 end-5 bg-yellow-500 border border-yellow-500 rounded-full shadow-md shadow-yellow-200 text-black cursor-pointer md:hidden">
          <PopoverButton className="flex relative gap-3 items-center m-auto px-3 py-2">
            <div className={`${!hasNotification && "hidden"} absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full`}></div>
            <span><FontAwesomeIcon icon={faBell} /></span>
            <p>Notification</p>
          </PopoverButton>
          <PopoverPanel anchor="top end" transition className="flex flex-col origin-bottom mb-2 p-2 space-y-1 z-10 border-2 border-red-200 bg-white rounded-lg shadow-md text-sm  transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0">
            {
              !hasNotification ?
              <p className="p-5">There are no notifications for now.</p> :
              notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).map((notif, index) => 
                notif.tipe.indexOf("|") > -1 ?
                <>
                  <div className="flex justify-between items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-red-100" onDoubleClick={() => navigate(`/helpdesk/info/${notif.tipe.split("|")[0]}`)}>
                    <p key={notif.tipe} className="text-justify">
                      {notif.tipe.split("|")[1] === "revision_done" ? `Revision was done by publisher for Helpdesk number ` : notif.tipe.split("|")[1] === "follow_up" ? "The publisher follows up for the progress of Helpdesk number " : `GMG gave ${notif.tipe.split("|")[1].split("_")[0] === "revision" ? "revision" : "reject"} feedback for Helpdesk number `}<span className="text-red-500 font-semibold">{notif.tipe.split("|")[0]}</span>
                    </p>
                    <div className="self-stretch my-1 border-r-2 border-r-gray-300"></div>
                    <span className="w-5 p-1 rounded-full text-gray-500 font-semibold cursor-pointer hover:bg-red-50 hover:text-red-500" onClick={async () => await deleteNotification(notif.tipe.split("|")[0])}><FontAwesomeIcon size="sm" icon={faX}/></span>
                  </div><hr className={`mx-1 text-gray-400 ${index === notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).length - 1 && "hidden"}`}/>
                </> :
                <>
                  <p key={notif.tipe} className="px-3 py-2 rounded-md hover:bg-red-100">
                  You have <span className="text-red-500 font-semibold">{notif.jumlah}</span> notification(s) on <span className="text-red-500 font-semibold">{notif.tipe}</span>
                  </p><hr className={`mx-1 text-gray-400 ${index === notificationList.filter(notif => notif.jumlah > 0 && !["Created Helpdesk", "Waiting for Approval", "Waiting for Review", "Approval Request", "Job Registration"].includes(notif.tipe)).length - 1 && "hidden"}`}/>
                </>
              )
            }
          </PopoverPanel>
        </Popover>
        <div className="absolute bottom-5 end-5 flex items-center space-x-3 px-3 py-1 bg-red-500 rounded-full shadow shadow-red-200 text-white cursor-pointer md:hidden" onClick={() => navigate("/helpdesk/create")}>
          <span><FontAwesomeIcon icon={faPlus} /></span>
          <p className="text-sm">Create new Helpdesk</p>
        </div>
      </div>
    </motion.div>
  );
};
