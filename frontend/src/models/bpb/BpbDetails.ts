class BpbDetails {
  linenum: number;
  readonly qty: number;
  readonly satuan: string;
  readonly nama: string;
  readonly wajibKembali: string;
  tsKembali: Date = new Date("1900-01-01");

  // Constructor for Helpdesk Details class
  constructor(linenum: number = -1, qty: number = -1, satuan: string = "", nama: string = "", wajibKembali: string = "", tsKembali: Date = new Date("1900-01-01")) {
    this.linenum = linenum;
    this.qty = qty;
    this.satuan = satuan;
    this.nama = nama;
    this.wajibKembali = wajibKembali;
    this.tsKembali = tsKembali;
  };
};

export default BpbDetails;
