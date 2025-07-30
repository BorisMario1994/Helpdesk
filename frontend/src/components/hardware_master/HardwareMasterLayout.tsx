import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import HardwareMaster from "../../models/master/HardwareMaster";

export function HardwareMasterLayout({ hardwareMaster, openEditHardwareMaster }: { hardwareMaster: HardwareMaster, openEditHardwareMaster: Function }) {
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p>{`${hardwareMaster.code} - ${hardwareMaster.descrption}`}</p>
          <p className={`text-xs ${hardwareMaster.isActive ? "text-green-700" : "text-red-500"}`}>{hardwareMaster.isActive ? "ACTIVE" : "INACTIVE"}</p>
        </DisclosureButton>
        <DisclosurePanel className="w-12 self-end me-2 mb-2 text-xs">
          <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditHardwareMaster(hardwareMaster)} />
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
