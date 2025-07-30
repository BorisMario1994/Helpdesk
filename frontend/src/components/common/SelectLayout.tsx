import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

type SelectLayoutProps = {
  id: string;
  options: string[];
  value?: string;
  isError?: boolean;
  onChange?: (value: string) => void;
};

export function SelectLayout({ id, options, value = "", isError = false, onChange }: SelectLayoutProps) {
  return (
    <Listbox name={id} defaultValue={value} onChange={onChange}>
      <ListboxButton className={`w-full h-10 flex relative px-3 pe-8 py-2 ${isError && "bg-red-100"} border border-gray-400 rounded-lg text-sm text-start data-[hover]:border-red-200 data-[hover]:shadow-md data-[hover]:shadow-red-200 data-[focus]:bg-red-100`}>
        <p className="text-nowrap overflow-hidden">{value}</p>
        <span className="absolute right-3"><FontAwesomeIcon icon={faChevronDown} /></span>
      </ListboxButton>
      <ListboxOptions anchor="bottom" className="w-[var(--button-width)] h-max-48 bg-white rounded-lg shadow-lg text-sm z-10 overflow-y-auto [--anchor-max-height:15rem]" >
        {options.map((option) => (
          <ListboxOption key={option} value={option} className="w-full px-3 py-2 cursor-default data-[focus]:bg-red-100 data-[focus]:text-red-500 data-[focus]:font-semibold">
            {option}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  ); 
};
