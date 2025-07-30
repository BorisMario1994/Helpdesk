import image404 from "../assets/404.svg";

export function PageNotFound() {
  return (
    <div className="w-full flex flex-col items-center mx-auto px-3 py-5 xl:w-5xl">
      <img className="w-96 h-96 -mb-10" src={image404} alt="PAGE NOT FOUND" />
      <p className="w-8/12 text-center">Page not exists. Check the URL or use the navigation bar on the top of the page to redirect to valid page.</p>
    </div>
  );
};
