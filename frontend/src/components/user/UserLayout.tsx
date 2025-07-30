import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Fragment } from "react/jsx-runtime";
import { ButtonLayout } from "../common/ButtonLayout";
import User from "../../models/master/User";

export function UserLayout({ user, openEditUser, selectUserToResetPassword }: { user: User, openEditUser: Function, selectUserToResetPassword: Function }) {
  return (
    <Disclosure as={Fragment}>
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md">
        <DisclosureButton className="w-full flex justify-between items-center gap-5 p-2 text-sm text-start font-semibold">
          <p className="font-semibold">{user.username}</p>
          <p className="text-sm"><span className="text-xs">Superior: </span>{user.superior}</p>
        </DisclosureButton>
        <DisclosurePanel className="flex justify-end gap-2 me-2 mb-2 text-xs">
          <div className="w-32">
            <ButtonLayout text="Reset Password" type="outline" colorClass="red-500" onClick={() => selectUserToResetPassword(user.username)} />
          </div>
          <div className="w-16">
            <ButtonLayout text="Edit" type="outline" colorClass="yellow-500" onClick={() => openEditUser(user)} />
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
