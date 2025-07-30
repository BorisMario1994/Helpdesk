import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Switch } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import User from "../../models/master/User";

type ManageUserPanelProps = {
  mode: string;
  user: User;
  traverseBack: () => void;
  showToast: (message: string) => void;
};

export function ManageUserPanel({ mode, user, traverseBack, showToast }: ManageUserPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [userList, setUserList] = useState<User[]>([]);
  
  const usernameInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [selectedLevel, setSelectedLevel] = useState(mode === "add" ? "" : user.lvl);
  const [selectedSuperior, setSelectedSuperior] = useState(mode === "add" ? "" : user.superior);
  const [isActive, setIsActive] = useState(mode === "add" ? false : user.isActive);
  const [usernameInputError, setUsernameInputError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRequiredData = async() => {
    try {
      setIsError(false);
      setIsLoading(true);
      setUserList(await User.getUserList());
    } catch(err: any) {
      switch (err.response.data.name) {
        case "TokenExpired":
          await auth.refresh();
          return await getRequiredData();
        case "AuthorizationFailed":
          auth.logout();
          navigate("/login", { replace: true });
          break;
        default: 
          setIsError(true);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async () => {
    if (mode === "edit" || (mode === "add" && usernameInput.current)) {
      if (mode === "add" && usernameInput.current && usernameInput.current.value.length <= 0) {
        showToast("User data is incomplete. Cannot create / update user data.");
        setUsernameInputError(usernameInput.current.value.length <= 0 ? "Username field is empty." : "");
        return;
      }

      setIsSubmitting(true);
      try {
        const userData = new User(mode === "add" ? usernameInput?.current?.value : user.username, selectedLevel, isActive, selectedSuperior);
        if (mode === "add")
          await userData.createUserData();
        else if (mode === "edit") 
          await userData.updateUserData();

        showToast(`User data has been ${mode === "add" ? "created" : "updated"}.`);
        traverseBack();
      } catch(err: any) {
        switch (err.response.data.name) {
          case "TokenExpired":
            await auth.refresh();
            return await submit();
          case "AuthorizationFailed":
            auth.logout();
            navigate("/login", { replace: true });
            break;
          case "RecordExists":
            showToast("Entered username was registered. Cannot create user.");
            break;
          default: 
            showToast("An error has occured while creating / updating User's data. If this problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    getRequiredData();
  }, []);

  return isLoading ?
  (
    <div className="mx-auto my-10">
      <Loader2 className="mx-auto animate-spin text-red-500" size={40} />
      <p className="mt-3 text-sm">Loading, please wait...</p>
    </div>
  ) : isError ?
  (
    <div className="flex flex-col mt-10 px-5 space-y-5">
      <span className="self-center text-gray-400"><FontAwesomeIcon icon={faCircleExclamation} size="5x" /></span>
      <p className="self-center text-sm text-center">An error has occured when loading data from server. If the problem persist, please contact ISW.</p>
      <div className="mx-auto w-32 text-sm">
        <ButtonLayout text="Reload" type="outline" colorClass="red-500" onClick={getRequiredData} />
      </div>
    </div> 
  ) :
  (
    <div className="space-y-5">
      {
        mode === "add" 
        ? <InputFieldLayout ref={usernameInput} label="Username" type="text" id="usernameInput" placeholder="Enter new username" errorText={usernameInputError} onInputChange={() => setUsernameInputError("")} enabled={!isSubmitting} /> 
        : <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="text-lg font-semibold text-red-400">{user.username}</p>
          </div>
      }
      <InputFieldLayout label="Level" type="select" id="levelSelect" options={["", "SPV", "MGR", "DVH", "WGM", "GMG"]} value={selectedLevel} onSelectChange={setSelectedLevel} enabled={!isSubmitting} />
      <InputFieldLayout label="Superior" type="select" id="superiorSelect" options={userList.map(user => user.username)} value={selectedSuperior} onSelectChange={setSelectedSuperior} enabled={!isSubmitting} />
      <div className="flex justify-between items center">
        <p className="text-sm text-gray-500">Active</p>
        <Switch checked={isActive} onChange={setIsActive} className="group inline-flex h-6 w-11 items-center rounded-full bg-red-700 transition data-checked:bg-green-700" >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
      </div>
      <ButtonLayout ref={btnSubmit} text={mode === "add" ? "Create" : "Update"} type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={submit} />
    </div>
  );
};
