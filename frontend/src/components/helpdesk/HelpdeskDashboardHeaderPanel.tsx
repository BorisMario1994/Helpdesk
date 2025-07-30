export function HelpdeskDashboardHeaderPanel({ notifList }: { notifList: { tipe: string, jumlah: number }[] }) {
  return (
    <div className="mx-3 md:mx-0">
      <h1 className="text-3xl font-bold tracking-wide">Helpdesk </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <div className="border-1 border-gray-200 shadow-md p-3 rounded-xl">
          <p className="text-md">Revision Required</p>
          <p className="text-end text-xl font-semibold">{notifList.find(notif => notif.tipe === "Created Helpdesk")?.jumlah || 0}</p>
        </div>
        <div className="border-1 border-gray-200 shadow-md p-3 rounded-xl">
          <p className="text-md">Waiting for Approval</p>
          <p className="text-end text-xl font-semibold">{notifList.find(notif => notif.tipe === "Waiting for Approval")?.jumlah || 0}</p>
        </div>
        <div className="border-1 border-gray-200 shadow-md p-3 rounded-xl">
          <p className="text-md">Approval Request</p>
          <p className="text-end text-xl font-semibold">{notifList.find(notif => notif.tipe === "Approval Request")?.jumlah || 0}</p>
        </div>
        <div className="border-1 border-gray-200 shadow-md p-3 rounded-xl">
          <p className="text-md">Job Registration</p>
          <p className="text-end text-xl font-semibold">{notifList.find(notif => notif.tipe === "Job Registration")?.jumlah || 0}</p>
        </div>
      </div>
    </div>
  );
};
