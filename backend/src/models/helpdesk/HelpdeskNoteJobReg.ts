import { Prisma } from "@prisma/client";
import { HelpdeskNoteJobReg } from "../../../generated/prisma";
import prisma from "../../PrismaConnection";

class HelpdeskNoteJobRegModel {
  readonly linenum: number;
  readonly tanggal: Date;
  readonly username: string;
  comment: string;

  constructor(linenum: number, tanggal: Date, username: string, comment: string) {
    this.linenum = linenum;
    this.tanggal = tanggal;
    this.username = username;
    this.comment = comment;
  };

  static createFromType(note: HelpdeskNoteJobReg) {
    const helpdeskNote = new HelpdeskNoteJobRegModel(note.LineNum, note.Tanggal, note.Username, note.Comment);
    return helpdeskNote;
  };

  createAsType = (nomor: string, linenumJobReg: number) => {
    const data: HelpdeskNoteJobReg = {
      Nomor: nomor,
      LineNumDetails: linenumJobReg,
      LineNum: this.linenum,
      Tanggal: this.tanggal,
      Username: this.username,
      Comment: this.comment
    };
    return data;
  };

  static async generateLatestNumber(nomor: string, linenumJobReg: number) {
    const latestNumber = await prisma.helpdeskNoteJobReg.aggregate({
      _max: { LineNum: true },
      where: { Nomor: nomor, LineNumDetails: linenumJobReg }
    });
    return latestNumber._max.LineNum !== null ? latestNumber._max.LineNum + 1 : 0;
  };

  insertNote = async (nomor: string, linenumJobReg: number, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskNoteJobReg.create({
      data: this.createAsType(nomor, linenumJobReg)
    });
  };

  static bulkInsertNote = async (nomor: string, linenumJobReg: number, noteList: HelpdeskNoteJobRegModel[], tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskNoteJobReg.createMany({
      data: noteList.map(note => note.createAsType(nomor, linenumJobReg))
    });
  };
}

export default HelpdeskNoteJobRegModel;
