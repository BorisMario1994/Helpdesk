import { faBars, faHouse, faCompass, faChevronDown, faUser, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { LinkButtonLayout } from "./common/LinkButtonLayout";
import logoImg from "../assets/logo-red-bg.jpg";

export function NavBar({ openSettingsDialog, isMobileSize }: { openSettingsDialog: Function, isMobileSize: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  // const appDisclosureRef = useRef<HTMLDivElement>(null);
  const discoverDisclosureRef = useRef<HTMLDivElement>(null);
  // const [appDisclosureHeight, setAppDisclosureHeight] = useState("0px");
  const [discoverDisclosureHeight, setDiscoverDisclosureHeight] = useState("0px");

  // const [appDisclosureOpen, setAppDisclosureOpen] = useState(false);
  const [discoverDisclosureOpen, setDiscoverDisclosureOpen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    if (!isMobileSize) {
      /*
      if (appDisclosureOpen)
        document.getElementById("btn-app-disclosure")?.click();
      */
      if (discoverDisclosureOpen)
        document.getElementById("btn-discover-disclosure")?.click();

      setNavigationOpen(false);
    }
  }, [isMobileSize]);

  useEffect(() => {
    setMaxHeight(contentRef.current && isMobileSize && navigationOpen ? `2000px` : "0px");
  }, [navigationOpen, isMobileSize]);

  /*
  useEffect(() => {
    setAppDisclosureHeight(appDisclosureOpen && appDisclosureRef.current ? `${appDisclosureRef.current.scrollHeight}px` : "0px");
  }, [appDisclosureOpen]);
  */

  useEffect(() => {
    setDiscoverDisclosureHeight(discoverDisclosureOpen && discoverDisclosureRef.current ? `${discoverDisclosureRef.current.scrollHeight}px` : "0px");
  }, [discoverDisclosureOpen]);

  return (
    <nav className="sticky top-0 w-full z-5 bg-red-600 shadow-lg shadow-red-300 outline outline-red-100 select-none">
      <div className="flex items-center mx-auto xl:w-7xl">
        <div className="w-full flex flex-col justify-between md:flex-row">
          <div className="flex space-x-5 px-3 md:px-0">
            <div className="my-auto px-3 py-2 border-2 border-gray-300 rounded-lg shadow-md text-white cursor-pointer md:hidden" onClick={() => { if (isMobileSize) { setNavigationOpen(!navigationOpen); } }}>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <div className="flex my-1 space-x-5 cursor-pointer" onClick={() => navigate("/helpdesk/main/all", { replace: true })}>
              <img className="w-32" src={logoImg} alt="LOGO" />
              <div className="my-auto">
                <p className="font-roboto font-bold text-2xl text-white">HELPDESK</p>
                <p className="text-xs text-white">PT HOKINDA CITRALESTARI</p>
              </div>
            </div>
          </div>
          <div ref={contentRef} className={`flex flex-col gap-2 px-3 ${navigationOpen && "pb-2"} rounded-r-md text-white transition-all duration-300 ease-in-out overflow-hidden md:flex-row md:ms-auto md:my-auto ${isMobileSize ? "opacity-0" : "opacity-100"} ${isMobileSize && navigationOpen ? "opacity-100" : ""}`} style={{maxHeight: isMobileSize ? maxHeight : "none"}}>
            <LinkButtonLayout text="Home" link="/helpdesk/main/all" prefixIcon={isMobileSize && <FontAwesomeIcon icon={faHouse} />} styling="w-full p-2 rounded-lg font-semibold md:px-3 md:py-2" />
            {
              /*
                <Disclosure>
                  
                  
                  <DisclosureButton className="w-full flex justify-between p-2 rounded-lg cursor-pointer text-start font-semibold md:hidden hover:bg-red-100 hover:text-red-600" id="btn-app-disclosure" onClick={() => setAppDisclosureOpen(!appDisclosureOpen)}>
                    <p><span className={`w-8 ${isMobileSize && "inline-block"}`}><FontAwesomeIcon icon={faLayerGroup}/></span>Apps</p>
                    <span className={`self-center transition-transform duration-300  ${appDisclosureOpen && "rotate-180"}`}><FontAwesomeIcon icon={faChevronDown} /></span>
                  </DisclosureButton>
                  <DisclosurePanel ref={appDisclosureRef} className={`origin-top transition-all duration-300 ease-in-out md:hidden overflow-hidden ${appDisclosureOpen ? "opacity-100" : ""}`} style={{ maxHeight: appDisclosureOpen ? appDisclosureHeight : "none" }}>
                    <ul className="ml-8 space-y-0.5">
                      <li><LinkButtonLayout text="Helpdesk" link="/main/all" /></li>
                      {
                        // comment too
                        <hr className="border-gray-200" />
                        <li><LinkButtonLayout text="Penanganan Keluhan Pelanggan (PKP)" openLink={() => {}} /></li>
                        <hr className="border-gray-200" />
                        <li><LinkButtonLayout text="Surat Keluhan Mutu (SKM)" openLink={() => {}} /></li>
                        // commented too
                      }
                    </ul>
                  </DisclosurePanel>
                </Disclosure>
              */
            }
            {
              /*
                <Popover className="hidden my-auto rounded-lg cursor-pointer md:flex hover:bg-red-100 hover:text-red-500">
                  <PopoverButton className="flex px-3 py-2 cursor-pointer font-semibold"><span className="mr-3 md:hidden"><FontAwesomeIcon icon={faLayerGroup}/></span>Apps<span><FontAwesomeIcon className="ml-3 text-sm" icon={faChevronDown} /></span></PopoverButton>
                  <PopoverPanel anchor="bottom" transition className="flex flex-col origin-top p-1 space-y-1 z-10 border-1 border-gray-200 rounded-lg bg-white shadow-md text-sm font-semibold text-red-500 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0">
                    <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer" onClick={() => navigate("/main/all", { replace: true })}>Helpdesk</a>
                    {
                      // commented too
                      <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer">Penanganan Keluhan Pelanggan (PKP)</a>
                      <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer">Surat Keluhan Mutu (SKM)</a>
                      // commented too
                    }
                  </PopoverPanel>
                </Popover>
              */
            }
            {
              
              <Popover className="hidden my-auto rounded-lg cursor-pointer md:flex hover:bg-red-100 hover:text-red-500">
                <PopoverButton className="flex px-3 py-2 cursor-pointer font-semibold"><span className="mr-3 md:hidden"><FontAwesomeIcon icon={faLayerGroup}/></span>Apps<span><FontAwesomeIcon className="ml-3 text-sm" icon={faChevronDown} /></span></PopoverButton>
                <PopoverPanel anchor="bottom" transition className="flex flex-col origin-top p-1 space-y-1 z-10 border-1 border-gray-200 rounded-lg bg-white shadow-md text-sm font-semibold text-red-500 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0">
                  <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer" onClick={() => navigate("/helpdesk/main/all", { replace: true })}>Helpdesk</a>
                  <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer" onClick={() => navigate("/bpb/main/all", { replace: true })}>Bon Pengantar Barang (BPB)</a>
                  <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer">Penanganan Keluhan Pelanggan (PKP)</a>
                  <a className="p-2 rounded-md font-semibold hover:bg-red-100 cursor-pointer">Surat Keluhan Mutu (SKM)</a>
                </PopoverPanel>
              </Popover>
              
            }
            <Disclosure>
              <DisclosureButton className="w-full flex justify-between p-2 rounded-lg cursor-pointer text-start font-semibold md:hidden hover:bg-red-100 hover:text-red-600" id="btn-discover-disclosure" onClick={() => setDiscoverDisclosureOpen(!discoverDisclosureOpen)}>
                <p><span className={`w-8 ${isMobileSize && "inline-block"}`}><FontAwesomeIcon icon={faCompass}/></span>Explore</p>
                <span className={`self-center transition-transform duration-300 ${discoverDisclosureOpen && "rotate-180"}`}><FontAwesomeIcon icon={faChevronDown} /></span>
              </DisclosureButton>
              <DisclosurePanel ref={discoverDisclosureRef} className={`origin-top transition-all duration-300 ease-in-out md:hidden overflow-hidden ${discoverDisclosureOpen ? "opacity-100" : ""}`} style={{ maxHeight: discoverDisclosureOpen ? discoverDisclosureHeight : "none" }}>
                <ul className="ml-8 space-y-0.5">
                  <li><LinkButtonLayout text="SquirrelMail" link="http://192.168.52.18:8080/intranet/src/login.php" target="_blank" /></li>
                  <hr className="border-gray-200" />
                  <li><LinkButtonLayout text="SAP Reports" link="http://192.168.52.34/reports" target="_blank" /></li>
                  <hr className="border-gray-200" />
                  <li><LinkButtonLayout text="Webdoc" link="http://192.168.52.17/webdoc" target="_blank" /></li>
                  <hr className="border-gray-200" />
                  <li><LinkButtonLayout text="SPiSy" link="http://192.168.54.35/" target="_blank" /></li>
                </ul>
              </DisclosurePanel>
            </Disclosure>
            <Popover className="hidden my-auto rounded-lg cursor-pointer md:flex hover:bg-red-100 hover:text-red-500">
              <PopoverButton className="flex px-3 py-2 cursor-pointer font-semibold"><span className="mr-3 md:hidden"><FontAwesomeIcon icon={faCompass}/></span>Explore<span><FontAwesomeIcon className="ml-3 text-sm" icon={faChevronDown} /></span></PopoverButton>
              <PopoverPanel anchor="bottom" transition className="flex flex-col origin-top p-1 space-y-1 z-10 border-1 border-gray-200 rounded-lg bg-white shadow-md text-sm font-semibold text-red-500 transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0">
                <a className="p-2 rounded-md hover:bg-red-100" href="http://192.168.52.18:8080/intranet/src/login.php" target="_blank">SquirrelMail</a>
                <a className="p-2 rounded-md hover:bg-red-100" href="http://192.168.52.34/reports" target="_blank">SAP Reports</a>
                <a className="p-2 rounded-md hover:bg-red-100" href="http://192.168.52.17/webdoc" target="_blank">Webdoc</a>
                <a className="p-2 rounded-md hover:bg-red-100" href="http://192.168.54.35/" target="_blank">SPiSy</a>
              </PopoverPanel>
            </Popover>
          </div>
        </div>
        <div className="flex flex-col shrink-0 items-end px-3 cursor-pointer" onClick={() => openSettingsDialog()}>
          <div className="flex space-x-2">
            <div className="w-10 h-10 flex border-2 border-white rounded-full">
              <span className="m-auto text-white"><FontAwesomeIcon icon={faUser} size="sm" /></span>
            </div>
            <span className="hidden my-auto text-sm text-white md:flex">{auth.user?.username}</span>
          </div>
          <div className="flex gap-1">
            <span className="hidden my-auto text-[10px] text-white md:flex">Impersonating:</span>
            <span className="hidden my-auto text-[10px] text-white md:flex">{auth.scope?.username}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
