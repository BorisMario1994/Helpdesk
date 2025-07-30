
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ButtonLayout } from "./common/ButtonLayout";

export function LogoutConfirmationPanel({ traverseBack } : { traverseBack: Function }) {
  const auth = useAuth();
  const navigate = useNavigate();

  const logout = async() => {
    await auth.logout();
    navigate("login", { replace: true });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <p>You're about to logging out of this account. Confirm to log out?</p>
        <div className="flex items-center self-end gap-5 text-sm text-nowrap">
          <ButtonLayout type="text" text="Cancel" colorClass="green-700" onClick={() => traverseBack()} />
          <ButtonLayout type="outline" text="Log Out" colorClass="red-500" onClick={logout} />
        </div>
      </div>

    </>
  );
};

