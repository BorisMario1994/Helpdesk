/*
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { formatInTimeZone } from "date-fns-tz";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import AktivaMaster from "../../models/AktivaMaster";

export function AktivaMasterLayout({ aktivaMaster, openEditHardwareMaster }: { aktivaMaster: AktivaMaster, openEditHardwareMaster: Function }) {
  const dateFormatter = (date: Date) => formatInTimeZone(date, "Asia/Jakarta", "EEEE, d MMMM yyyy");
  
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p>{`${aktivaMaster.kodeAktiva} - ${aktivaMaster.descrption}`}</p>
          <p className={`text-xs ${aktivaMaster.tanggalAfkir.getMilliseconds() < new Date().getMilliseconds() ? "text-green-700" : "text-red-500"}`}>{aktivaMaster.tanggalAfkir.getMilliseconds() < new Date().getMilliseconds() ? "ACTIVE" : "INACTIVE"}</p>
        </DisclosureButton>
        <DisclosurePanel className="flex flex-col px-2">
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Hardware Type</p>
            <p className="text-sm">{aktivaMaster.hardwareCode}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Brand</p>
            <p className="text-sm">{aktivaMaster.merk}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Purchase Date</p>
            <p className="text-sm">{dateFormatter(aktivaMaster.tanggalPembelian)}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Guarantee Expired On</p>
            <p className="text-sm">{aktivaMaster.batasGaransi.getFullYear() === 1900 ? "-" : dateFormatter(aktivaMaster.batasGaransi)}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-sm text-gray-500">Reject Date</p>
            <p className="text-sm">{aktivaMaster.tanggalAfkir.getFullYear() === 1900 ? "-" : dateFormatter(aktivaMaster.tanggalAfkir)}</p>
          </div>
          <div className="w-16 self-end mb-2 text-xs">
            <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditHardwareMaster(aktivaMaster)} />
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
*/
