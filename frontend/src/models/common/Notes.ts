class Notes {
  readonly linenum: number;
  tanggal: Date;
  readonly username: string;
  readonly comment: string;
  readonly mentions: string[];

  // Constructor for Helpdesk Note class
  constructor(linenum: number = -1, tanggal: Date = new Date(), username: string = "", comment: string = "", mentions: string[] = []) {
    this.linenum = linenum;
    this.tanggal = tanggal;
    this.username = username;
    this.comment = comment;
    this.mentions = mentions;
  };
}

export default Notes;
