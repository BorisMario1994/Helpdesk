import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import BagianMaster from "../../models/master/BagianMaster";

export function BagianMasterLayout({ bagianMaster, openEditBagianMaster }: { bagianMaster: BagianMaster, openEditBagianMaster: Function }) {
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p>{`${bagianMaster.code} - ${bagianMaster.descrption}`}</p>
          <p className={`text-xs ${bagianMaster.isActive ? "text-green-700" : "text-red-500"}`}>{bagianMaster.isActive ? "ACTIVE" : "INACTIVE"}</p>
        </DisclosureButton>
        <DisclosurePanel className="w-16 self-end me-2 mb-2 text-xs">
          <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditBagianMaster(bagianMaster)} />
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
