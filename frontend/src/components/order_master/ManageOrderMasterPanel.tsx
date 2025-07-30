import { Switch } from "@headlessui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { ButtonLayout } from "../common/ButtonLayout";
import { InputFieldLayout } from "../common/InputFieldLayout";
import OrderMaster from "../../models/master/OrderMaster";

type ManageOrderMasterPanelProps = {
  mode: string;
  orderMaster: OrderMaster;
  traverseBack: () => void;
  showToast: (message: string) => void;
};

export function ManageOrderMasterPanel({ mode, orderMaster, traverseBack, showToast }: ManageOrderMasterPanelProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const orderMasterCodeInput = useRef<HTMLInputElement>(null);
  const orderMasterDescInput = useRef<HTMLInputElement>(null);
  const btnSubmit = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(mode === "add" ? false : orderMaster.isActive);
  const [orderMasterCodeInputError, setOrderMasterCodeInputError] = useState("");
  const [orderMasterDescInputError, setorderMasterDescInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if ((mode === "edit" || (mode === "add" && orderMasterCodeInput.current)) && orderMasterDescInput.current) {
      if ((mode === "add" && (orderMasterCodeInput?.current?.value.length || 0) <= 0) || orderMasterDescInput.current.value.length <= 0) {
        showToast("Order Master data is incomplete. Make sure every required field is filled.");
        setOrderMasterCodeInputError(orderMasterCodeInput?.current?.value.length || 0 <= 0 ? "Order Master code field is empty." : "");
        setorderMasterDescInputError(orderMasterDescInput.current.value.length <= 0 ? "Description field is empty." : "");
        return;
      }

      setIsSubmitting(true);
      try {
        const orderMasterData = new OrderMaster(mode === "add" ? orderMasterCodeInput?.current?.value : orderMaster.code, orderMasterDescInput.current.value, isActive);
        if (mode === "add")
          await orderMasterData.createOrderMasterData();
        else if (mode === "edit")
          await orderMasterData.updateOrderMasterData();

        showToast(`Order Master data has been ${mode === "add" ? "created" : "updated"}.`);
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
            showToast("The inserted Order Master code was registered. Cannot create Order Master data.");
            break;
          default: 
            showToast("An error has occured when creating / updating Order Master data. If the problem persist, please contact ISW.");
            break;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      {
        mode === "add" 
        ? <InputFieldLayout ref={orderMasterCodeInput} label="Code" type="text" id="orderMasterCode" placeholder="Enter Order Master code" value="" errorText={orderMasterCodeInputError} /> 
        : <div>
            <p className="text-sm text-gray-500">Order Master Code</p>
            <p className="text-lg font-semibold text-red-500">{orderMaster.code}</p>
          </div>
      }
      <InputFieldLayout ref={orderMasterDescInput} label="Description" type="text" id="orderMasterDescription" placeholder="Enter Order Master description" value={orderMaster.descrption} errorText={orderMasterDescInputError} onInputChange={() => setorderMasterDescInputError("")} />
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
