import { faList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from './AuthProvider';
import { LinkButtonLayout } from './common/LinkButtonLayout';

type CategoryNav = {
  name: string;
  text: string;
  url: string;
  hidden: boolean;
};

type CategoriesNavigationProps = {
  type: string;
  activeCategory: string;
  notifList: { tipe: string, jumlah: number }[];
};

export function CategoriesNavigationPanel({ type, activeCategory, notifList }: CategoriesNavigationProps) {
  const auth = useAuth();
  const helpdeskCategoryNavList: CategoryNav[] = [
    { name: "all", text: "All", url: "/helpdesk/main/all", hidden: false },
    { name: "created", text: "Created Helpdesk", url: "/helpdesk/main/created", hidden: false },
    { name: "unpublished", text: "Unpublished", url: "/helpdesk/main/unpublished", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "approved", text: "Approved", url: "/helpdesk/main/approved", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "revision", text: "Revision", url: "/helpdesk/main/revision", hidden: false },
    { name: "rejected", text: "Rejected", url: "/helpdesk/main/rejected", hidden: false },
    { name: "waiting-for-approval", text: "Waiting for Approval", url: "/helpdesk/main/waiting-for-approval", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "waiting-for-review", text: "Waiting for Review", url: "/helpdesk/main/waiting-for-review", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "approval-request", text: "Approval Request", url: "/helpdesk/main/approval-request", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "job-registration", text: "Job Registration", url: "/helpdesk/main/job-registration", hidden: false },
    { name: "done", text: "Done", url: "/helpdesk/main/done", hidden: false }
  ];

  const bpbCategoryNavList: CategoryNav[] = [
    { name: "all", text: "All BPB", url: "/bpb/main/all", hidden: false },
    { name: "created", text: "Created BPB", url: "/bpb/main/created", hidden: false },
    { name: "unpublished", text: "Unpublished (BPB)", url: "/bpb/main/unpublished", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "approved", text: "Approved (BPB)", url: "/bpb/main/approved", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "revision", text: "Revision (BPB)", url: "/bpb/main/revision", hidden: false },
    { name: "rejected", text: "Rejected (BPB)", url: "/bpb/main/rejected", hidden: false },
    { name: "waiting-for-approval", text: "Waiting for Approval (BPB)", url: "/bpb/main/waiting-for-approval", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "waiting-for-review", text: "Waiting for Review (BPB)", url: "/bpb/main/waiting-for-review", hidden: (auth.scope?.lvl.length || 0) <= 0 && !["JPJL", "MSSA", "MWGM"].includes(auth.scope?.username.substring(0, 4) || "") && auth.scope?.username.substring(1, 4) !== "PBL" },
    { name: "job-registration", text: "Job Registration (BPB)", url: "/bpb/main/job-registration", hidden: false },
    { name: "done", text: "Done (BPB)", url: "/bpb/main/done", hidden: false }
  ];

  return (
    <div className="mx-3 p-3 border-1 border-gray-300 shadow-md rounded-xl md:basis-2/9 md:mx-0 md:pb-10 md:overflow-y-hidden">
      <p className="font-semibold"><i><FontAwesomeIcon icon={faList} className="mr-3" /></i>Categories</p>
      <div className=" flex flex-row flex-nowrap overflow-x-auto py-5 space-x-2 text-sm text-nowrap md:flex-col md:h-full md:space-x-0 md:space-y-2 md:ml-5 md:pe-1 md:overflow-y-auto md:text-wrap">
        {
          ( type === "helpdesk" ? helpdeskCategoryNavList : type === "bpb" ? bpbCategoryNavList : helpdeskCategoryNavList).map((categoryNav) =>
            <LinkButtonLayout key={categoryNav.name} link={categoryNav.url} text={categoryNav.text} suffixIcon={(notifList.find(notif => notif.tipe === categoryNav.text)?.jumlah || 0) > 0 ? <p className="py-1 bg-red-500 rounded-full text-xs text-white text-center font-semibold">{notifList.find(notif => notif.tipe === categoryNav.text)?.jumlah}</p> : null} active={activeCategory === categoryNav.name} styling={`${categoryNav.hidden && "hidden"} w-full flex justify-between items-center gap-2 px-3 py-2 border-1 border-gray-300 rounded-full`} />
          )
        }
      </div>
    </div>
  );
};
