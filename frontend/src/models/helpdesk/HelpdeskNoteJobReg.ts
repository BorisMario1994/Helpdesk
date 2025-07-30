class HelpdeskNoteJobReg {
  readonly linenum: number;
  tanggal: Date;
  readonly username: string;
  readonly comment: string;

  // Constructor for Helpdesk Note class
  constructor(linenum: number = -1, tanggal: Date = new Date(), username: string = "", comment: string = "") {
    this.linenum = linenum;
    this.tanggal = tanggal;
    this.username = username;
    this.comment = comment;
  };
}

export default HelpdeskNoteJobReg;
