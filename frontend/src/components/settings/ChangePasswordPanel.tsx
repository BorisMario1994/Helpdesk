import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import User from "../../models/master/User";

export function ChangePasswordPanel({ traverseBack, showToast }: { traverseBack: () => void, showToast: (message: string) => void }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const currentPasswordInput = useRef<HTMLInputElement>(null);
  const newPasswordInput = useRef<HTMLInputElement>(null);
  const confirmPasswordInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);

  const [currentPasswordInputError, setCurrentPasswordInputError] = useState("");
  const [newPasswordInputError, setNewPasswordInputError] = useState("");
  const [confirmPasswordInputError, setConfirmPasswordInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changePassword = async () => {
    if (currentPasswordInput.current && newPasswordInput.current && confirmPasswordInput.current && btnSubmit.current) {
      if (currentPasswordInput.current.value.length <= 0 || newPasswordInput.current.value.length <= 0 || confirmPasswordInput.current.value.length <= 0) {
        showToast("Required fields are incomplete. Cannot change password.");

        setCurrentPasswordInputError(currentPasswordInput.current.value.length <= 0 ? "Current password field is empty." : "");
        setNewPasswordInputError(newPasswordInput.current.value.length <= 0 ? "New password field is empty." : "");
        setConfirmPasswordInputError(confirmPasswordInput.current.value.length <= 0 ? "Password confirmation field is empty." : "");
        return;
      } else if (newPasswordInput.current.value !== confirmPasswordInput.current.value) {
        showToast("Confirmation password doesn't match with the new password. Cannot change password.");
        setConfirmPasswordInputError("Confirmation password doesn't match with the new password.");
        return;
      }

      setIsSubmitting(true);
      try {
        const username = auth.user?.username ?? "";
        const oldPassword = currentPasswordInput.current.value;
        const newPassword = newPasswordInput.current.value;
        await User.changePassword(username, oldPassword, newPassword);
        showToast("Password changed successfully.");
        traverseBack();
      } catch (err: any) {
        switch (err.response.data.name) {
          case "TokenExpired":
            await auth.refresh();
            return await changePassword();
          case "AuthorizationFailed":
            auth.logout();
            navigate("/login", { replace: true });
            break;
          default: 
            showToast("An error has occured when changing password. If the problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-500">Username</p>
        <p className="text-lg font-semibold text-red-400">{auth.user?.username}</p>
      </div>
      <InputFieldLayout ref={currentPasswordInput} label="Current Password" type="password" id="currentPassword" placeholder="Enter current password" errorText={currentPasswordInputError} enabled={!isSubmitting} onInputChange={() => setCurrentPasswordInputError("")} />
      <InputFieldLayout ref={newPasswordInput} label="New Password" type="password" id="newPassword" placeholder="Enter new password" errorText={newPasswordInputError} enabled={!isSubmitting} onInputChange={() => setNewPasswordInputError("")} />
      <InputFieldLayout ref={confirmPasswordInput} label="Confirm Password" type="password" id="confirmPassword" placeholder="Re-type new password" errorText={confirmPasswordInputError} enabled={!isSubmitting} onInputChange={() => setConfirmPasswordInputError("")} />
      <ButtonLayout ref={btnSubmit} text="Change" type="solid" colorClass="red-500" enabled={!isSubmitting} loading={isSubmitting} onClick={changePassword} />
    </div>
  );
};

