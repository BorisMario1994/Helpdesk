import api from "../../api";
import { sha256 } from "js-sha256";
import BpbDetails from "./BpbDetails";
import BpbCc from "./BpbCc";
import BpbNote from "./BpbNote";

class BpbHeader {
  nomor: string;
  dari: string;
  cardCode: string;
  kepada: string;
  keterangan: string = "";
  ref: string = ""
  status: string;
  tanggalTerbit: Date;
  tanggalSelesai: Date = new Date("1900-01-01");
  hashedFile: string = "";
  file: File = new File([], "");
  namaFile: string = "";
  readonly progress: string = "";
  readonly notified: boolean = false;
  detailsList: Array<BpbDetails> = [];
  ccList: Array<BpbCc> = [];
  noteList: Array<BpbNote> = [];

  // Constructor for BPB Header class
  constructor(nomor: string, dari: string, cardCode: string, kepada: string, status: string, tanggalTerbit: Date) {
    this.nomor = nomor;
    this.dari = dari;
    this.cardCode = cardCode;
    this.kepada = kepada;
    this.status = status;
    this.tanggalTerbit = tanggalTerbit;
  };

  // Method to send GET request to backend for requesting list of BPB based on category passed as parameter in the method. 
  static getBpbList = async (type: string) => {
    const bpbList = await api.apiInstance.get(`/bpb/list/${type}`);
    const bpbHeaderList = bpbList.data as BpbHeader[];
    bpbHeaderList.forEach(bpb => {
      bpb.tanggalTerbit = new Date(bpb.tanggalTerbit);
      bpb.tanggalSelesai = new Date(bpb.tanggalSelesai);
    });
    return bpbHeaderList;
  }

  // Method to send GET request to backend for requesting a complete BPB data with  number passed as parameter in the method. 
  static getBpbByNumber = async (nomor: string) => {
    const data = (await api.apiInstance.get(`/bpb/${nomor}`)).data as BpbHeader;
    const bpbHeader = new BpbHeader(data.nomor, data.dari, data.cardCode, data.kepada, data.status, new Date(data.tanggalTerbit));
    
    bpbHeader.keterangan = data.keterangan;
    bpbHeader.ref = data.ref;
    bpbHeader.tanggalSelesai = new Date(data.tanggalSelesai);
    bpbHeader.namaFile = data.namaFile;
    bpbHeader.hashedFile = data.hashedFile;
    
    const newCcList: BpbCc[] = [];
    data.ccList.forEach(cc => {
      cc.tanggalAc = new Date(cc.tanggalAc);
      const newCcData = new BpbCc(cc.linenum, cc.cc, cc.ac, cc.tanggalAc, cc.pic, cc.file, cc.namaFile);
      newCcList.push(newCcData);
    })
    bpbHeader.ccList = [...newCcList];

    const newDetailsList: BpbDetails[] = [];
    data.detailsList.forEach(details => {
      details.tsKembali = new Date(details.tsKembali)
      const newDetails = new BpbDetails(details.linenum, details.qty, details.satuan, details.nama, details.wajibKembali, details.tsKembali);
      newDetailsList.push(newDetails);
    })
    bpbHeader.detailsList = [...newDetailsList];

    const newNoteList: BpbNote[] = [];
    data.noteList.forEach(note => {
      note.tanggal = new Date(note.tanggal);
      newNoteList.push(new BpbNote(note.linenum, note.tanggal, note.username, note.comment, note.mentions));
    });
    bpbHeader.noteList = [...newNoteList];

    return bpbHeader;
  };

  // Method to send POST request to backend for creating a new BPB record in database. 
  createBpb = async () => {
    const data = new FormData();
    data.append("json", JSON.stringify(this));
    if (this.file.size > 0)
      data.append("file", this.file);

    const response = await api.apiInstance.post("/bpb", data, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data.nomor as string;
  };

  // Method to send PUT request to backend for updating all current BPB's data after revision made by the BPB's publisher.
  reviseBpb = async (note: BpbNote) => {
    const data = new FormData();
    const allData = { ...this, note };
    data.append("json", JSON.stringify(allData));
    if (this.file.size > 0)
      data.append("file", this.file);

    return api.apiInstance.put(`/bpb/${this.nomor}/revision`, data, { headers: { "Content-Type": "multipart/form-data" } });
  };

  updateBpbNote = async (type: string, note: BpbNote) => api.apiInstance.post(`bpb/${this.nomor}/note/${type}`, { data: note });

  // Method to send PUT request to backend for updating current BPB's status after a reply message for GMG
  // is sent by Division/Department head of the BPB's publisher as a response for questions given by GMG. 
  reviseBpbFromDeptHead = async (note: BpbNote) => api.apiInstance.put(`/bpb/${this.nomor}/revision-dept-head`, { data: note });

  replyForReview = async (note: BpbNote) => api.apiInstance.put(`/bpb/${this.nomor}/cc/reply-review`, { data: note });

  // Method to send PUT request to backend for re-opening current BPB. 
  reopenBpb = async(role: string) => api.apiInstance.put(`/bpb/${this.nomor}/reopen/${role}`);

  // Method for hashing the file uploaded by publisher of current BPB instance, used when application is
  // trying to compare between previously uploaded file with current session's uploaded file and decide whether 
  // a process of re-asking feedback from CC is neccessary or not. 
  hashUploadedFile = async () => {
    const arrayBuffer = await this.file.arrayBuffer();
    const hashBuffer = sha256(arrayBuffer);
    const hashArray = Array.from(new Uint8Array(this.hexToUint8Array(hashBuffer)));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // Method to download file from database associated with current BPB's number and with the filename
  // of the one's passed on the parameter when calling this method. 
  downloadFile = async (filename: string) => {
    const response = await api.apiInstance.get(`/bpb/download/${this.nomor}/${filename}`, {
      responseType: 'blob' // very important!
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Set the filename
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  hexToUint8Array = (hex: string): Uint8Array => {
    const length = hex.length / 2;
    const arr = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return arr;
  };
};

export default BpbHeader;


