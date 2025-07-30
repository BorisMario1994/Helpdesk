import { faChevronDown, faDatabase, faSignOut, faUnlock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { InputFieldLayout } from "../common/InputFieldLayout";
import { LinkButtonLayout } from "../common/LinkButtonLayout";
import User from "../../models/master/User";
import { useNavigate } from "react-router-dom";

export function MainSettingsPanel({ traverseForward }: { traverseForward: (path: string) => void }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [selectedActiveUser, setSelectedActiveUser] = useState(auth.scope?.username ?? auth.user?.username ?? "");
  const [inferiorList, setInferiorList] = useState<string[]>([]);

  useEffect(() => {
    const getInferiorList = async () => {
      try {
        const userList = await User.getUserListAdjustedSuperior() as User[];
        setInferiorList(userList.filter(user => user.superior === auth.user?.username && user.isActive).map(user => user.username));
        if (auth.user?.inferior)
          auth.user.inferior = userList.filter(user => user.superior === auth.user?.username && user.isActive).map(user => user.username);

      } catch(err: any) {
        switch (err.response.data.name) {
          case "TokenExpired":
            await auth.refresh();
            return await getInferiorList();
          case "AuthorizationFailed":
            auth.logout();
            navigate("/login", { replace: true });
            break;
          default: 
            break;
        }
      }
    };

    getInferiorList();
  }, [])

  useEffect(() => {
    if (selectedActiveUser !== (auth.scope?.username ?? auth.user?.username ?? "")) {
      localStorage.setItem("scope", selectedActiveUser);
      window.location.reload();
    }
  }, [selectedActiveUser]);

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <p className="text-sm self-center">Logging in as:</p>
        <p className="font-semibold text-lg text-red-400">{auth.user?.username}</p>
      </div>
      <div className={`${(auth.user?.inferior.length || 0) > 0 ? "flex" : "hidden"} justify-between`}>
        <p className="text-sm self-center">Accessing apps as:</p>
        <InputFieldLayout label="" id="activeUserSelect" type="select" options={[...[auth.user?.username || ""], ...(inferiorList || [])]} value={selectedActiveUser} onSelectChange={setSelectedActiveUser} additionalClass="basis-1/4" />
      </div>
      <div className="space-y-1 text-sm">
        <LinkButtonLayout text="Change Password" prefixIcon={ <FontAwesomeIcon icon={faUnlock}/> } openLink={() => traverseForward("changePassword")} />
        <hr className="border-t-1 border-t-gray-300" />
        <Disclosure as={Fragment}>
          <DisclosureButton className={`w-full ${auth.user?.username === "MITC-01" ? "flex" : "hidden"} justify-between p-2 rounded-lg cursor-pointer text-start hover:bg-red-100 hover:text-red-600 hover:font-semibold`}>
            <p><span className="w-8 inline-block"><FontAwesomeIcon icon={faDatabase}/></span>Master Data</p>
            <span className="self-center"><FontAwesomeIcon icon={faChevronDown} /></span>
          </DisclosureButton>
          <DisclosurePanel transition className="origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0">
            <ul className="ml-8 space-y-0.5">
              <li><LinkButtonLayout text="User Master Data" openLink={() => traverseForward("master|User")} /></li>
              <hr className="border-gray-200" />
              <li><LinkButtonLayout text="Division / Department Master Data" openLink={() => traverseForward("master|DivisionDepartmentMaster")} /></li>
              <hr className="border-gray-200" />
              <li><LinkButtonLayout text="Order Master Data" openLink={() => traverseForward("master|OrderMaster")} /></li>
              <hr className="border-gray-200" />
              <li><LinkButtonLayout text="Hardware Master Data" openLink={() => traverseForward("master|HardwareMaster")} /></li>
              { /* <li><LinkButtonLayout text="Aktiva Master Data" openLink={() => traverseForward("master|AktivaMaster")} /></li> */ }
              <hr className="border-gray-200" />
              <li><LinkButtonLayout text="Master Masalah PKP" openLink={() => traverseForward("master|MasterMasalahPkp")} /></li>
            </ul>
          </DisclosurePanel>
        </Disclosure>
        <hr className={`${auth.user?.username === "MITC-01" ? "flex" : "hidden"} border-t-1 border-t-gray-300`} />
        <LinkButtonLayout text="Log Out" prefixIcon={ <FontAwesomeIcon icon={faSignOut}/> } openLink={() => traverseForward("logout")} />
      </div>
    </div>  
  );
};