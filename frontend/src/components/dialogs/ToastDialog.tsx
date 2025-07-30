export function ToastDialog({ message, showToast }: { message: string, showToast: boolean }) {
  return (
    <div className={`absolute start-0 end-0 w-10/12 max-w-2xl p-3 m-auto bottom-0 mb-20 bg-red-100 border-2 border-red-500 rounded-lg shadow-xl text-center text-sm font-semibold transition-all delay-100 duration-300 ${showToast ? "z-20 opacity-100" : "-z-10 opacity-0"}`}>
      <p>{message}</p>
    </div>
  );
};
