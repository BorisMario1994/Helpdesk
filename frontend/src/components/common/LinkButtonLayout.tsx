import { Link } from "react-router-dom";

type LinkButtonLayoutProps = {
  text: string;
  openLink?: Function;
  link?: string;
  target?: string;
  styling?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  active?: boolean;
};

export function LinkButtonLayout({ text, openLink, link = "", target = "_self", styling, prefixIcon, suffixIcon, active }: LinkButtonLayoutProps) {
  const handleClicked = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (openLink) {
      event.preventDefault();
      openLink();
    }
  };

  return (
    <Link to={link} target={target} replace={true} className={`${styling || "w-full inline-block p-2 rounded-lg"} ${active && "bg-red-100 text-red-600 font-semibold"} text-start cursor-pointer hover:bg-red-100 hover:text-red-600 hover:font-semibold`} onClick={handleClicked}>
      <span className={`${!prefixIcon ? "hidden" : "w-8 inline-block"}`}>{prefixIcon}</span>
      {text}
      <span className={`${!suffixIcon ? "hidden" : "w-8 inline-block"}`}>{suffixIcon}</span>
    </Link>
  );
};
