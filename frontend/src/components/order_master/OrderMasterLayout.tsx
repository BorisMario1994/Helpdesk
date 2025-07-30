import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import OrderMaster from "../../models/master/OrderMaster";

export function OrderMasterLayout({ orderMaster, openEditOrderMaster }: { orderMaster: OrderMaster, openEditOrderMaster: Function }) {
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p>{`${orderMaster.code} - ${orderMaster.descrption}`}</p>
          <p className={`text-xs ${orderMaster.isActive ? "text-green-700" : "text-red-500"}`}>{orderMaster.isActive ? "ACTIVE" : "INACTIVE"}</p>
        </DisclosureButton>
        <DisclosurePanel className="w-16 self-end me-2 mb-2 text-xs">
          <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditOrderMaster(orderMaster)} />
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
