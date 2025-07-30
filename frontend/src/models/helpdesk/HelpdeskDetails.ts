import HelpdeskNoteJobReg from "./HelpdeskNoteJobReg";

class HelpdeskDetails {
  linenum: number;
  readonly order: string;
  readonly jumlah: number;
  readonly keterangan: string;
  status: string;
  noAktiva: string;
  pic: string;
  tanggalTerima: Date;
  ts: Date;
  tanggalSelesai: Date;
  noteList: Array<HelpdeskNoteJobReg> = [];

  // Constructor for Helpdesk Details class
  constructor(linenum: number, order: string, jumlah: number, keterangan: string, status: string, noAktiva: string = "", pic: string = "", tanggalTerima: Date = new Date("1900-01-01"), ts: Date = new Date("1900-01-01"), tanggalSelesai: Date = new Date("1900-01-01")) {
    this.linenum = linenum;
    this.order = order;
    this.jumlah = jumlah;
    this.keterangan = keterangan;
    this.status = status;
    this.noAktiva = noAktiva;
    this.pic = pic;
    this.tanggalTerima = tanggalTerima;
    this.ts = ts;
    this.tanggalSelesai = tanggalSelesai;
  };
};

export default HelpdeskDetails;
