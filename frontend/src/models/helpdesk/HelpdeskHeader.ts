import HelpdeskCc from "./HelpdeskCc";
import HelpdeskDetails from "./HelpdeskDetails";
import Notes from "../common/Notes";
import api from "../../api";
import HelpdeskNoteJobReg from "./HelpdeskNoteJobReg";
import { sha256 } from "js-sha256";

class HelpdeskHeader {
  nomor: string;
  title: string;
  tipe: string;
  prioritas: string;
  dari: string;
  kepada: string;
  status: string;
  pertimbangan: string = "";
  tanggalTerbit: Date;
  tanggalTerima: Date = new Date("1900-01-01");
  tanggalSelesai: Date = new Date("1900-01-01");
  hashedFile: string = "";
  file: File = new File([], "");
  namaFile: string = "";
  fileKepada: File = new File([], "");
  namaFileKepada: string = "";
  readonly progress: string = "";
  readonly notified: boolean = false;
  detailsList: Array<HelpdeskDetails> = [];
  ccList: Array<HelpdeskCc> = [];
  noteList: Array<Notes> = [];

  // Constructor for Helpdesk Header class
  constructor(nomor: string, title: string, tipe: string, prioritas: string, dari: string, kepada: string, tanggalTerbit: Date, status: string) {
    this.nomor = nomor;
    this.title = title;
    this.tipe = tipe;
    this.prioritas = prioritas;
    this.dari = dari;
    this.kepada = kepada;
    this.tanggalTerbit = tanggalTerbit;
    this.status = status;
  };

  // Method to send GET request to backend for requesting list of helpdesk based on category passed as parameter in the method. 
  static getHelpdeskList = async (type: string) => {
    const helpdeskList = await api.apiInstance.get(`/helpdesk/list/${type}`);
    const helpdeskHeaderList = helpdeskList.data as HelpdeskHeader[];
    helpdeskHeaderList.forEach(helpdesk => {
      helpdesk.tanggalTerbit = new Date(helpdesk.tanggalTerbit);
    });
    return helpdeskHeaderList;
  }

  // Method to send GET request to backend for requesting list of notifications for helpdesk apps or other apps. 
  static getNotificationList = async () => (await api.apiInstance.get("/helpdesk/notif")).data;

  // Method to send DELETE request to backend for deleting a notification record to make notification disappear when next time retrieve notification.
  static deleteNotification = async (nomor: string, username: string) => (await api.apiInstance.delete(`/helpdesk/${nomor}/notif/${username}`))

  // Method to send GET request to backend for requesting a complete helpdesk data with  number passed as parameter in the method. 
  static getHelpdeskByNumber = async (nomor: string) => {
    const data = (await api.apiInstance.get(`/helpdesk/${nomor}`)).data as HelpdeskHeader;
    const helpdeskHeader = new HelpdeskHeader(data.nomor, data.title, data.tipe, data.prioritas, data.dari, data.kepada, new Date(data.tanggalTerbit), data.status);
    
    helpdeskHeader.pertimbangan = data.pertimbangan;
    helpdeskHeader.tanggalTerima = new Date(data.tanggalTerima);
    helpdeskHeader.tanggalSelesai = new Date(data.tanggalSelesai);
    helpdeskHeader.namaFile = data.namaFile;
    helpdeskHeader.hashedFile = data.hashedFile;
    helpdeskHeader.namaFileKepada = data.namaFileKepada;
    
    const newCcList: HelpdeskCc[] = [];
    data.ccList.forEach(cc => {
      cc.tanggalAc = new Date(cc.tanggalAc);
      const newCcData = new HelpdeskCc(cc.linenum, cc.cc, cc.ac, cc.tanggalAc, cc.pic, cc.file, cc.namaFile);
      newCcList.push(newCcData);
    })
    helpdeskHeader.ccList = [...newCcList];

    const newDetailsList: HelpdeskDetails[] = [];
    data.detailsList.forEach(details => {
      details.tanggalTerima = new Date(details.tanggalTerima);
      details.ts = new Date(details.ts);
      details.tanggalSelesai = new Date(details.tanggalSelesai);
      const newDetails = new HelpdeskDetails(details.linenum, details.order, details.jumlah, details.keterangan, details.status, details.noAktiva, details.pic, details.tanggalTerima, details.ts, details.tanggalSelesai);
      newDetails.noteList.push(...details.noteList.map(note => new HelpdeskNoteJobReg(note.linenum, new Date(note.tanggal), note.username, note.comment)));
      newDetailsList.push(newDetails);
    })
    helpdeskHeader.detailsList = [...newDetailsList];

    const newNoteList: Notes[] = [];
    data.noteList.forEach(note => {
      note.tanggal = new Date(note.tanggal);
      newNoteList.push(new Notes(note.linenum, note.tanggal, note.username, note.comment, note.mentions));
    });
    helpdeskHeader.noteList = [...newNoteList];

    return helpdeskHeader;
  };

  // Method to send POST request to backend for creating a new Helpdesk record in database. 
  createHelpdesk = async () => {
    const data = new FormData();
    data.append("json", JSON.stringify(this));
    if (this.file.size > 0)
      data.append("file", this.file);

    const response = await api.apiInstance.post("/helpdesk", data, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data.nomor as string;
  };

  // Method to send PUT request to backend for updating all current helpdesk's data after revision made by the helpdesk's publisher.
  reviseHelpdesk = async (note: Notes) => {
    const data = new FormData();
    const allData = { ...this, note };
    data.append("json", JSON.stringify(allData));
    if (this.file.size > 0)
      data.append("file", this.file);

    return api.apiInstance.put(`/helpdesk/${this.nomor}/revision`, data, { headers: { "Content-Type": "multipart/form-data" } });
  };

  updateHelpdeskNote = async (type: string, note: Notes) => api.apiInstance.post(`helpdesk/${this.nomor}/note/${type}`, { data: note });

  // Method to send PUT request to backend for updating current helpdesk's status after a reply message for GMG
  // is sent by Division/Department head of the helpdesk's publisher as a response for questions given by GMG. 
  reviseHelpdeskFromDeptHead = async (note: Notes) => api.apiInstance.put(`/helpdesk/${this.nomor}/revision-dept-head`, { data: note });

  replyForReview = async (note: Notes) => api.apiInstance.put(`/helpdesk/${this.nomor}/cc/reply-review`, { data: note });

  // Method to send PUT request to backend for updating Job Registration (Helpdesk Details) data 
  // associated with current helpdesk's number, together with feedback, feedback's complimentary file, 
  // or additional notes in the database.
  static updateHelpdeskFeedbackAndJobReg = async (nomor: string, response: { feedback: string, file: File }, detailsList: HelpdeskDetails[], note: Notes) => {
    const data = new FormData();
    const allData = { feedback: response.feedback, namaFileKepada: response.file.name, detailsList, note }; 
    data.append("json", JSON.stringify(allData));
    if (response.file.size > 0)
      data.append("file", response.file);

    return api.apiInstance.put(`/helpdesk/${nomor}/feedback`, data, { headers: { "Content-Type": "multipart/form-data" } });
  };

  // Method to send PUT request to backend for updating all Job Registration (Helpdesk Details) data
  // associated with current helpdesk's number in database.
  static updateJobRegistration = async(nomor: string, detailsList: HelpdeskDetails[]) => api.apiInstance.put(`/helpdesk/${nomor}/job-reg/update`, { data: detailsList });

  // Method to send PUT request to backend for re-opening current helpdesk. 
  reopenHelpdesk = async(role: string) => api.apiInstance.put(`/helpdesk/${this.nomor}/reopen/${role}`);

  // Method for hashing the file uploaded by publisher of current helpdesk instance, used when application is
  // trying to compare between previously uploaded file with current session's uploaded file and decide whether 
  // a process of re-asking feedback from CC is neccessary or not. 
  hashUploadedFile = async () => {
    const arrayBuffer = await this.file.arrayBuffer();
    const hashBuffer = sha256(arrayBuffer);
    const hashArray = Array.from(new Uint8Array(this.hexToUint8Array(hashBuffer)));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // Method to download file from database associated with current helpdesk's number and with the filename
  // of the one's passed on the parameter when calling this method. 
  downloadFile = async (filename: string) => {
    const response = await api.apiInstance.get(`/helpdesk/download/${this.nomor}/${encodeURIComponent(filename)}`, {
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

export default HelpdeskHeader;
