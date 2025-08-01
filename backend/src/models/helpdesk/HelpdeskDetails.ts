import prisma from "../../PrismaConnection";
import { HelpdeskDetails } from "../../../generated/prisma";
import { Prisma } from "@prisma/client";
import HelpdeskNoteJobRegModel from "./HelpdeskNoteJobReg";

// HelpdeskDetailsModel class is used for encapsulating Helpdesk Details properties with all of its method for creating, updating or retrieving data from database. 
// It is created based on HelpdeskDetails table structure in database and to align with the type created by Prisma ORM.  
class HelpdeskDetailsModel {
  readonly linenum: number;
  readonly order: string;
  readonly jumlah: number;
  readonly keterangan: string;
  status: string;
  readonly noAktiva: string = "";
  readonly remarks: string = "";
  readonly pic: string = "";
  readonly tanggalTerima: Date = new Date("1900-01-01");
  readonly ts: Date = new Date("1900-01-01");
  tanggalSelesai: Date = new Date("1900-01-01");
  readonly printKe: number = 0;
  readonly noteList: Array<HelpdeskNoteJobRegModel> = [];

  // Constructor for HelpdeskDetailsModel class
  constructor(linenum: number, order: string, jumlah: number, keterangan: string, status: string, noAktiva: string = "", remarks: string = "", pic: string = "", tanggalTerima: Date = new Date("1900-01-01"), ts: Date = new Date("1900-01-01"), tanggalSelesai: Date = new Date("1900-01-01"), printKe: number = 0) {
    this.linenum = linenum;
    this.order = order;
    this.jumlah = jumlah;
    this.keterangan = keterangan;
    this.status = status;
    this.noAktiva = noAktiva;
    this.remarks = remarks;
    this.pic = pic;
    this.tanggalTerima = tanggalTerima;
    this.ts = ts;
    this.tanggalSelesai = tanggalSelesai;
    this.printKe = printKe;
  };

  // Secondary constructor of HelpdeskDetailsModel class that requires a HelpdeskDetails typed object as its only parameter.
  static createFromType(details: HelpdeskDetails) {
    return new HelpdeskDetailsModel(details.LineNum, details.Order, details.Jumlah, details.Keterangan, details.Status, details.NoAktiva, details.Remarks, details.PIC, details.TanggalTerima, details.TS, details.TanggalSelesai, details.PrintKe);
  };

  // Method for converting current HelpdeskDetailsModel instance to HelpdeskDetails type generated by Prisma ORM.
  createAsType = (nomor: string) => {
    const data: HelpdeskDetails = {
      Nomor: nomor,
      LineNum: this.linenum,
      Order: this.order,
      Jumlah: this.jumlah,
      Keterangan: this.keterangan,
      Status: this.status,
      NoAktiva: this.noAktiva,
      Remarks: this.remarks,
      PIC: this.pic,
      TanggalTerima: this.tanggalTerima,
      TS: this.ts,
      TanggalSelesai: this.tanggalSelesai,
      PrintKe: this.printKe
    };
    return data;
  };

  // Method for inserting single Helpdesk Detail data to database table.
  insertDetails = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskDetails.create({
      data: this.createAsType(nomor)
    });
  };

  // Method for updating single Helpdesk Detail data to database table.
  updateDetails = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskDetails.update({
      where: { Nomor_LineNum: { Nomor: nomor, LineNum: this.linenum } },
      data: this.createAsType(nomor)
    });
  };

  // Method for inserting a list of Helpdesk Detail data with the Helpdesk number passed as parameter. This method also accept
  // an optional parameter with type of database transaction from Prisma. It will use the transaction instance
  // to execute the operation if the parameter is provided or plain prisma instance with no transaction if isn't.
  static bulkInsertDetails = async (nomor: string, detailsList: HelpdeskDetailsModel[], tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskDetails.createMany({
      data: detailsList.map(details => details.createAsType(nomor))
    });
  };

  // Method for delete existing list of Helpdesk Detail data based on Helpdesk number passed as parameter. This method also accept
  // an optional parameter with type of database transaction from Prisma. It will use the transaction instance
  // to execute the operation if the parameter is provided or plain prisma instance with no transaction if isn't.
  static bulkDeleteDetails = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.helpdeskDetails.deleteMany({
      where: { Nomor: nomor }
    });
  };
};

export default HelpdeskDetailsModel;
