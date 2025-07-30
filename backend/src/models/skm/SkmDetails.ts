import { Prisma } from "@prisma/client";
import { SkmDetails } from "../../../generated/prisma";
import prisma from "../../PrismaConnection";

class SkmDetailsModel {
  readonly linenum: number;
  readonly itemCode: string;
  readonly itemName: string;
  readonly keluhan: string;

  constructor(linenum: number, itemCode: string, itemName: string, keluhan: string) {
    this.linenum = linenum;
    this.itemCode = itemCode;
    this.itemName = itemName;
    this.keluhan = keluhan;
  }

  static createFromType(details: SkmDetails) {
    return new SkmDetailsModel(details.LineNum, details.ItemCode, details.ItemName, details.Keluhan);
  };

  createAsType = (nomor: string) => {
    const data: SkmDetails = {
      Nomor: nomor,
      LineNum: this.linenum,
      ItemCode: this.itemCode,
      ItemName: this.itemName,
      Keluhan: this.keluhan
    };
    return data;
  };

  insertDetails = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.SkmDetails.create({
      data: this.createAsType(nomor)
    });
  };

  static bulkInsertDetails = async (nomor: string, skmDetailsList: SkmDetailsModel[], tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmDetails.createMany({
      data: skmDetailsList.map(details => details.createAsType(nomor))
    });
  };

  static bulkDeleteDetails = async (nomor: string, tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.skmDetails.deleteMany({
      where: { Nomor: nomor }
    });
  };
};

export default SkmDetailsModel;