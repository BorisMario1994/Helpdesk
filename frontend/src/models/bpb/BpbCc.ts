import api from "../../api";
import BpbNote from "./BpbNote";

class BpbCc {
  linenum: number;
  cc: string;
  ac: string;
  tanggalAc: Date;
  readonly pic: string;
  readonly file: File;
  readonly namaFile: string;

  // Constructor for Helpdesk CC class
  constructor(linenum: number, cc: string, ac: string, tanggalAc: Date = new Date("1900-01-01"), pic: string = "", file: File = new File([], ""), namaFile: string = "") {
    this.linenum = linenum;
    this.cc = cc;
    this.ac = ac;
    this.tanggalAc = tanggalAc;
    this.pic = pic;
    this.file = file;
    this.namaFile = namaFile;
  };

  // Method to send PUT request to backend for updating current Helpdesk CC instance's response given by the CC
  // for opening the associated helpdesk. 
  updateCcData = async (nomor: string, note: BpbNote) => {
    const data = new FormData();
    const allData = { ...this, note: note };
    data.append("json", JSON.stringify(allData));
    if (this.file.size > 0)
      data.append("file", this.file);
    return api.apiInstance.put(`/bpb/${nomor}/cc/${this.linenum}/feedback`, data, { headers: { "Content-Type": "multipart/form-data" } });
  };
};

export default BpbCc;
