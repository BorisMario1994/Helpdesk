import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import MasterMasalahPkp from "../../models/master/MasterMasalahPkp";

export function MasterMasalahPkpLayout({ masterMasalahPkp, openEditMasterMasalahPkp }: { masterMasalahPkp: MasterMasalahPkp, openEditMasterMasalahPkp: Function }) {
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p>{masterMasalahPkp.masalah}</p>
          <p className={`text-xs ${masterMasalahPkp.isActive ? "text-green-700" : "text-red-500"}`}>{masterMasalahPkp.isActive ? "ACTIVE" : "INACTIVE"}</p>
        </DisclosureButton>
        <DisclosurePanel className="w-16 self-end me-2 mb-2 text-xs">
          <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditMasterMasalahPkp(masterMasalahPkp)} />
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
