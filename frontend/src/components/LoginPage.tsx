import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ButtonLayout } from "./common/ButtonLayout";
import { InputFieldLayout } from "./common/InputFieldLayout";
import logo from "../assets/logo-white-bg.jpg";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const btnLogin = useRef<HTMLButtonElement>(null);

  const [failedMessage, setFailedMessage] = useState("");
  const [usernameInputError, setUsernameInputError] = useState("");
  const [passwordInputError, setPasswordInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      login();
    }
  };

  const login = async () => {
    if (usernameInput.current && passwordInput.current && btnLogin.current) {
      if (usernameInput.current.value.length <= 0 || passwordInput.current.value.length <= 0) {
        setFailedMessage("Please fill all required fields.");
        setUsernameInputError(usernameInput.current.value.length <= 0 ? "Username field is empty." : "");
        setPasswordInputError(passwordInput.current.value.length <= 0 ? "Password field is empty." : "");
        return;
      }

      setIsSubmitting(true);
      setFailedMessage("");

      try {
        await auth.login(usernameInput.current.value, passwordInput.current.value);
        navigate("/helpdesk/main/all", {replace: true});
      } catch(err: any) {
        switch (err.response.data.name) {
          case "AuthenticationFailed":
            setFailedMessage("Wrong username or password, or user is deactivated.");
            break;
          default:
            setFailedMessage("An error has occured while logging in. If this problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const onInputChange = () => {
    if (usernameInput.current && passwordInput.current) {
      setUsernameInputError(usernameInput.current.value.length <= 0 && failedMessage.length > 0 ? "Username field is empty." : "");
      setPasswordInputError(passwordInput.current.value.length <= 0 && failedMessage.length > 0 ? "Password field is empty." : "");
    }
  };

  return (
    <div className="flex h-screen py-5 overflow-auto">
      <div className="w-11/12 m-auto p-5 shadow-xl rounded-lg border-2 border-gray-200 sm:max-w-xl">
        <img className="w-60 mx-auto" src={logo} alt="LOGO PT HOKINDA CITRALESTARI" />
        <p className="text-center text-2xl text-red-500 font-extrabold">HELPDESK PT HOKINDA CITRALESTARI</p>
        <div className="mt-5 space-y-3">
          <p className="text-bold">LOGIN</p>
          <div className="space-y-3" onKeyDown={enterKeyDown}>
            <InputFieldLayout ref={usernameInput} label="Username" id="txtBoxUsername" type="text" placeholder="Enter username" errorText={usernameInputError} onInputChange={onInputChange} enabled={!isSubmitting} />
            <InputFieldLayout ref={passwordInput} label="Password" id="txtBoxPassword" type="password" placeholder="Enter password" errorText={passwordInputError} onInputChange={onInputChange} enabled={!isSubmitting} />
          </div>
          <p className={`mt-3 p-2 bg-red-100 rounded-sm text-center text-xs text-red-500 ${failedMessage.length > 0 || "hidden"}`}>{failedMessage}</p>
          <ButtonLayout ref={btnLogin} text="LOGIN" type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={login} />
        </div>
        <div className="mt-5 text-center text-xs text-gray-500">
          <p>Copyright &copy; 2025 PT HOKINDA CITRALESTARI</p>
          <p>All rights reserved.</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};
