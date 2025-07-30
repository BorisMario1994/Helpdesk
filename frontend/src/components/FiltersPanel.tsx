import { faChevronDown, faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { ButtonLayout } from './common/ButtonLayout';
import { InputFieldLayout } from './common/InputFieldLayout';

type FiltersPanelProps = { 
  isMobileSize: boolean;
  setFilter: Function;
  filterReset: boolean;
  setFilterReset: Function;
  usernameList: string[];
  bagianTextList: string[];
}

export function FiltersPanel({ isMobileSize, setFilter, filterReset, setFilterReset, usernameList, bagianTextList }: FiltersPanelProps) {
  const filterBody = useRef<HTMLDivElement>(null);
  const [showFilterBody, setShowFilterBody] = useState(!isMobileSize);
  const [filterBodyMaxHeight, setFilterBodyMaxHeight] = useState("0px");

  const datePickerDari = useRef<HTMLInputElement>(null);
  const datePickerHingga = useRef<HTMLInputElement>(null);
  const [selectedDateDari, setSelectedDateDari] = useState("");
  const [selectedDateHingga, setSelectedDateHingga] = useState("");
  const [selectedPenerbit, setSelectedPenerbit] = useState("Select one");
  const [selectedKepada, setSelectedKepada] = useState("Select one");
  const [selectedOrderBy, setSelectedOrderBy] = useState("Select one");
  const btnReset = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowFilterBody(isMobileSize === false);
  }, [isMobileSize])

  useEffect(() => {
    if (filterBody.current && isMobileSize) {
      setFilterBodyMaxHeight(showFilterBody ? `${filterBody.current.scrollHeight}px` : "0px");
    }
  }, [showFilterBody, isMobileSize]);

  useEffect(() => {
    let dariDate = new Date(selectedDateDari);
    let hinggaDate = new Date(selectedDateHingga);
    dariDate = new Date(dariDate.getTime() + (dariDate.getTimezoneOffset() * 60 * 1000));
    hinggaDate = new Date(hinggaDate.getTime() + (24 * 60 * 60 * 1000) + (hinggaDate.getTimezoneOffset() * 60 * 1000) - 1);

    setFilter({ dari: dariDate, hingga: hinggaDate, penerbit: selectedPenerbit, kepada: selectedKepada, sortBy: selectedOrderBy });
  }, [selectedDateDari, selectedDateHingga, selectedPenerbit, selectedKepada.substring(0, 4), selectedOrderBy]);

  const resetFilter = () => {
    if (datePickerDari.current && datePickerHingga.current && btnReset.current) {
      datePickerDari.current.value = "";
      datePickerHingga.current.value = "";
      setSelectedPenerbit("Select one");
      setSelectedKepada("Select one");
      setSelectedOrderBy("Select one");
    }
  };

  useEffect(() => {
    if (filterReset) {
      resetFilter();
      setFilterReset(false);
    }
  }, [filterReset])

  return (
    <div className="mx-3 p-3 border-1 border-gray-300 shadow-md rounded-lg order-2 md:grow-0 md:basis-2/9 md:mx-0 md:p-0 md:pb-10 md:order-last md:border-0 md:shadow-none md:overflow-hidden">
      <div className="flex justify-between cursor-pointer md:cursor-default" onClick={() => { if (isMobileSize) { setShowFilterBody(!showFilterBody); } }}>
        <p className="font-semibold"><i><FontAwesomeIcon icon={faSliders} className="mr-3" /></i>Filter</p>
        <i className={`md:hidden transition-transform duration-300 ${showFilterBody ? "rotate-180" : ""}`}><FontAwesomeIcon className="text-sm" icon={faChevronDown}/></i>
      </div>
      <div ref={filterBody} className={`w-full h-full flex flex-col space-y-2 transition-all delay-100 duration-200 ease-in-out overflow-hidden md:mt-3 md:pe-1 md:pb-5 md:overflow-y-auto ${isMobileSize ? "opacity-0" : "opacity-100"} ${isMobileSize && showFilterBody ? "opacity-100" : ""}`} style={{ maxHeight: isMobileSize ? filterBodyMaxHeight : "none" }}>
        <p className="text-sm">Published Date</p>
        <InputFieldLayout ref={datePickerDari} label="From" type="date" id="datePickerFrom" onInputChange={() => setSelectedDateDari(datePickerDari.current?.value || "")} />
        <InputFieldLayout ref={datePickerHingga} label="Until" type="date" id="datePickerTo" onInputChange={() => setSelectedDateHingga(datePickerHingga.current?.value || "")} />
        <InputFieldLayout label="Publisher" type="select" id="dropdownFrom" value={selectedPenerbit} options={usernameList} onSelectChange={setSelectedPenerbit} />
        <InputFieldLayout label="Recipient" type="select" id="dropdownTo" value={selectedKepada} options={bagianTextList} onSelectChange={setSelectedKepada} />
        <InputFieldLayout label="Sort by" type="select" id="dropdownSortBy" value={selectedOrderBy} options={["Number", "Published Date", "Status"]} onSelectChange={setSelectedOrderBy} />
        <div className="self-end text-sm">
          <ButtonLayout ref={btnReset} text="Reset Filter" type="text" colorClass="yellow-500" onClick={resetFilter} />
        </div>
      </div>
    </div>
  );
};