import { Prisma } from "@prisma/client";
import { SkmCc } from "../../../generated/prisma";
import prisma from "../../PrismaConnection";

class SkmCcModel {
  phase: number;
  linenum: number;
  readonly cc: string;
  ac: string;
  readonly tanggalAc: Date;
  readonly pic: string;
  readonly namaFile: string;
  hashedFile: string = "";

  constructor(phase: number, linenum: number, cc: string, ac: string, tanggalAc: Date = new Date("1900-01-01"), pic: string = "", namaFile: string = "") {
    this.phase = phase;
    this.linenum = linenum;
    this.cc = cc;
    this.ac = ac;
    this.tanggalAc = tanggalAc;
    this.pic = pic;
    this.namaFile = namaFile;
  };

  static createFromType(cc: SkmCc) {
    return new SkmCcModel(cc.Phase, cc.LineNum, cc.CC, cc.AC, cc.TanggalAc, cc.PIC, cc.NamaFile);
  };

  createAsType = (nomor: string) => {
    const data: SkmCc = {
      Nomor: nomor,
      Phase: this.phase,
      LineNum: this.linenum,
      CC: this.cc,
      AC: this.ac,
      TanggalAc: this.tanggalAc,
      PIC: this.pic,
      NamaFile: this.namaFile
    };
    return data;
  };

  // Method for inserting single Helpdesk CC data to database table.
  insertCc = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmCc.create({
      data: this.createAsType(nomor)
    });
  };

  // Method for updating single Helpdesk CC data to database table.
  updateCc = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmCc.update({
      where: { Nomor_Phase_LineNum: { Nomor: nomor, Phase: this.phase, LineNum: this.linenum } } ,
      data: this.createAsType(nomor)
    });
  };

  static bulkInsertCc = async (nomor: string, ccList: SkmCcModel[], tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmCc.createMany({
      data: ccList.map(cc => cc.createAsType(nomor))
    });
  };

  static bulkDeleteCc = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmCc.deleteMany({
      where: { Nomor: nomor }
    });
  };
};

export default SkmCcModel;
