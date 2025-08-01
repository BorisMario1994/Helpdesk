import prisma from "../../PrismaConnection";
import { BpbHeader } from "../../../generated/prisma";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Prisma } from "@prisma/client";
import BpbDetailsModel from "./BpbDetails";
import BpbCcModel from "./BpbCc";
import BpbNoteModel from "./BpbNote";

// BpbHeaderModel class is used for encapsulating BPB Header properties with all of its method for creating, updating or retrieving data from database. 
// It is created based on BpbHeader table structure in database and to align with the type created by Prisma ORM, with some additional properties outside of 
// existing properties / columns from database table to support the needs of application.  
class BpbHeaderModel {
  nomor: string;
  readonly dari: string;
  cardCode: string;
  readonly kepada: string;
  keterangan: string = "";
  ref: string = ""
  status: string;
  readonly tanggalTerbit: Date;
  tanggalSelesai: Date = new Date("1900-01-01");
  hashedFile: string = "";
  namaFile: string = "";
  progress: string = "";
  notified: boolean = false;
  readonly detailsList: Array<BpbDetailsModel> = [];
  readonly ccList: Array<BpbCcModel> = [];
  readonly noteList: Array<BpbNoteModel> = [];

  // Constructor of the BPB Header class
  constructor(nomor: string, dari: string, cardCode: string, kepada: string, status: string, tanggalTerbit: Date) {
    this.nomor = nomor;
    this.dari = dari;
    this.cardCode = cardCode;
    this.kepada = kepada;
    this.status = status;
    this.tanggalTerbit = tanggalTerbit;
  };

  // Secondary constructor of BPB Header class by providing BpbHeader type value for its parameter
  static createFromType(bpb: BpbHeader) {
    const bpbHeader = new BpbHeaderModel(bpb.Nomor, bpb.Dari, bpb.CardCode, bpb.Kepada, bpb.Status, bpb.TanggalTerbit);
    bpbHeader.keterangan = bpb.Keterangan;
    bpbHeader.ref = bpb.Ref;
    bpbHeader.tanggalSelesai = bpb.TanggalSelesai;
    bpbHeader.namaFile = bpb.NamaFile;
    return bpbHeader;
  };

  // Method for converting current BpbHeader instance to BpbHeader type generated by Prisma ORM
  createAsType = () => {
    const data: BpbHeader = {
      Nomor: this.nomor,
      Dari: this.dari,
      CardCode: this.cardCode,
      Kepada: this.kepada,
      Keterangan: this.keterangan,
      Ref: this.ref,
      Status: this.status,
      TanggalTerbit: this.tanggalTerbit,
      TanggalSelesai: this.tanggalSelesai,
      NamaFile: this.namaFile
    }
    return data;
  };

  // Method for generating new number for new BPB by taking the latest number of the latest published BPB from the same division or department 
  // and on the same year.
  static async generateLatestNumber(bagian: string) {
    let prefixNumber = `BPB-${bagian}-${new Date().getFullYear()}-`;
    const latestNumber = await prisma.bpbHeader.aggregate({
      _max: { Nomor: true },
      where: { Nomor: { startsWith: prefixNumber } }
    });
    prefixNumber = prefixNumber.concat((latestNumber._max.Nomor !== null ? Number(latestNumber._max.Nomor.split("-")[3]) + 1 : 1).toString().padStart(4, '0'));
    return prefixNumber;
  };

  // Method to retrieve other applications notifications by executing the table-value function prepared before. The function also returns counter for
  // several BPB header catogories that needs current logged in user's action.
  static async getNotificationList(user: string) {
    const query: any[] = await prisma.$queryRaw`SELECT * FROM [dbo].[EF_GET_NOTIF](${user})`;
    const result: { tipe: string, jumlah: number }[] = [];
    query.forEach(line => result.push({ tipe: line.TIPE, jumlah: line.JUMLAH }));
    return result;
  };

  // Method to retrive a list of BPB Header data based on client's logged in user account and type of BPB Header category requested by client.
  static async getBpbListBySelection(user: string, type: string) {
    let whereClause = "";
    switch (type) {
      case "all":
        whereClause = `SUBSTRING(T0.Nomor, 1, 4) = SUBSTRING('${user}', 1, 4) AND (T0.Dari = '${user}' OR SUBSTRING('${user}', 5, 3) = '-01')`;
        break;
      case "created":
        whereClause = `T0.Dari = '${user}'`;
        break;
      case "unpublished":
        whereClause = `(CONCAT(T1.CC, '-01') = '${user}' OR (T1.CC = '${user}' AND (SUBSTRING('${user}', 1, 4) IN ('JPJL','MSSA','MWGM') OR '${user}' LIKE '%PBL%'))) AND T0.[Status] = 'UNPUBLISHED'`;
        break;
      case "approved":
        whereClause = `(CONCAT(T1.CC, '-01') = '${user}' OR (T1.CC = '${user}' AND (SUBSTRING('${user}', 1, 4) IN ('JPJL','MSSA','MWGM') OR '${user}' LIKE '%PBL%'))) AND T1.AC IN ('APPROVE','REVISION')`;
        break;
      case "revision":
        whereClause = `(CONCAT(T1.CC, '-01') = '${user}' OR (T1.CC = '${user}' AND (SUBSTRING('${user}', 1, 4) IN ('JPJL','MSSA','MWGM') OR '${user}' LIKE '%PBL%'))) AND T1.AC <> 'APPROVE' AND (SELECT COUNT(X.CC) FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.LineNum < T1.LineNum AND X.AC <> 'APPROVE') <= 0 AND T0.[Status] = 'REVISION'`;
        break;
      case "rejected":
        whereClause = `(CONCAT(T1.CC, '-01') = '${user}' OR (T1.CC = '${user}' AND (SUBSTRING('${user}', 1, 4) IN ('JPJL','MSSA','MWGM') OR '${user}' LIKE '%PBL%'))) AND (SELECT COUNT(X.CC) FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.LineNum < T1.LineNum AND X.AC <> 'APPROVE') <= 0 AND T0.[Status] = 'REJECTED'`;
        break;
      case "waiting-for-approval":
        whereClause = `(CONCAT(T1.CC, '-01') = '${user}' OR (T1.CC = '${user}' AND (SUBSTRING('${user}', 1, 4) IN ('JPJL','MSSA','MWGM') OR '${user}' LIKE '%PBL%'))) AND T1.AC <> 'APPROVE' AND (SELECT COUNT(X.CC) FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.LineNum < T1.LineNum AND X.AC <> 'APPROVE') <= 0 AND T0.[Status] NOT IN ('DONE','REJECTED','REVISION')`;
        break;
      case "waiting-for-review":
        whereClause = `T1.AC = 'REQUESTING REVIEW' AND '${user}' IN (SELECT CASE WHEN LEN(item) = 4 THEN CONCAT(item, '-01') ELSE item END item FROM [dbo].[ufnSplt](T2.Mentions, ','))`;
        break;
      case "job-registration":
        whereClause = `T1.PIC = '${user}' AND T0.[Status] NOT IN ('DONE', 'REJECTED', 'REVISION')`;
        break;
      case "done":
        whereClause = `(T0.Dari = '${user}' OR CONCAT(T1.CC, '-01') = '${user}' OR T1.PIC = '${user}') AND T0.[Status] = 'DONE'`
        break;
      default:
        whereClause = `SUBSTRING(T0.Nomor, 1, 4) = SUBSTRING('${user}', 1, 4) AND (T0.Dari = '${user}' OR SUBSTRING('${user}', 5, 3) = '-01')`;
        break;
    }

    const bpbList: BpbHeader[] = await prisma.$queryRawUnsafe(`SELECT DISTINCT T0.Nomor, T0.Dari, CASE WHEN ISNULL(T0.CardCode, '') = '' THEN CAST(T0.Kepada AS VARCHAR(MAX)) ELSE CONCAT(ISNULL((SELECT X.CardName COLLATE DATABASE_DEFAULT FROM SAPHCL.HOCK.DBO.OCRD X WHERE X.CardCode COLLATE DATABASE_DEFAULT = T0.CardCode COLLATE DATABASE_DEFAULT), ''), CHAR(10), CAST(T0.Kepada AS VARCHAR(MAX))) END Kepada, CAST(T0.Keterangan AS VARCHAR(MAX)) Keterangan, CAST(T0.Ref AS VARCHAR(MAX)) Ref, T0.TanggalTerbit, T0.[Status], CASE WHEN T0.[Status] = 'DONE' THEN 'Finished (Done)' WHEN T0.[Status] = 'REJECTED' THEN 'Rejected' WHEN T0.[Status] = 'REVISION' THEN (SELECT CONCAT('Revision was asked by Approver ', X.LineNum + 1, ' (', X.CC, ')') FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.AC = 'REVISION') WHEN T0.[Status] = 'UNPUBLISHED' THEN (SELECT CONCAT('Waiting for Approval from Approver ', X.LineNum + 1, ' (', X.CC, ')') FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.AC = 'NO ACTION' AND (SELECT COUNT(Y.CC) FROM BpbCc Y WHERE Y.Nomor = X.Nomor AND Y.LineNum < X.LineNum AND Y.AC <> 'APPROVE') <= 0) ELSE '' END CardCode, CASE WHEN T0.[Status] = 'REVISION' AND T0.Dari = '${user}' THEN 'Y' WHEN T0.[Status] = 'UNPUBLISHED' AND CONCAT((SELECT X.CC FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.AC = 'NO ACTION' AND (SELECT COUNT(Y.CC) FROM BpbCc Y WHERE Y.Nomor = X.Nomor AND Y.LineNum < X.LineNum AND Y.AC <> 'APPROVE') <= 0), '-01') = '${user}' THEN 'Y' WHEN T0.[Status] = 'UNPUBLISHED' AND (SELECT X.AC FROM BpbCc X WHERE X.Nomor = T0.Nomor AND X.AC = '${user}' AND (SELECT COUNT(Y.CC) FROM BpbCc Y WHERE Y.Nomor = X.Nomor AND Y.LineNum < X.LineNum AND Y.AC <> 'APPROVE') <= 0) = '${user}' THEN 'Y' WHEN T0.[Status] = 'UNPUBLISHED' AND (SELECT COUNT(X.CC) FROM BpbCc X WHERE X.AC = 'REQUESTING REVIEW' AND '${user}' IN (SELECT CASE WHEN LEN(item) = 4 THEN CONCAT(item, '-01') ELSE item END item FROM [dbo].[ufnSplt](T2.Mentions, ','))) > 0 THEN 'Y' ELSE 'N' END NamaFile FROM BpbHeader T0 LEFT JOIN BpbCc T1 ON T0.Nomor = T1.Nomor LEFT JOIN BpbNote T2 ON T0.Nomor = T2.Nomor WHERE ${whereClause} ORDER BY T0.TanggalTerbit DESC`);

    return bpbList.map(bpb => {
      const newBpb = BpbHeaderModel.createFromType(bpb);
      newBpb.progress = newBpb.cardCode;
      newBpb.notified = newBpb.namaFile === "Y";
      newBpb.cardCode = newBpb.namaFile = "";
      return newBpb;
    });
  };
/*
  static async test() {
    const dataList: { CardCode: string, CardName: string }[] = await prisma.$queryRaw`SELECT A.CardCode, A.CardName FROM SAPHCL.HOCK.DBO.OCRD A INNER JOIN SAPHCL.HOCK.DBO.CRD1 B ON A.CardCode = B.CardCode WHERE ISNULL(B.Street, '') <> ''`;
    return dataList;
  }
*/
  // Method to retrive a single BPB Header data together with its related value from dependent table (BPB Details, CC, and Note)
  // using the "nomor" value as parameter.
  static async getBpbByNumber(nomor: string) {
    const data = await prisma.bpbHeader.findFirstOrThrow({
      where: { Nomor: nomor },
      include: { BpbDetails: true, BpbCc: true, BpbNote: true }
    })
    console.log(data);
    const bpbHeader = BpbHeaderModel.createFromType(data);
    if (bpbHeader.namaFile.length > 0) {
      const filePath = path.join(__dirname, "../uploads/bpb/", bpbHeader.nomor, bpbHeader.namaFile);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        bpbHeader.hashedFile = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      }
    }

    bpbHeader.detailsList.push(...data.BpbDetails.map(details => BpbDetailsModel.createFromType(details)));
    
    bpbHeader.ccList.push(...data.BpbCc.map(ccData => {
      let hashedFile = "";
      if (ccData.NamaFile.length > 0) {
        const filePath = path.join(__dirname, "../uploads/bpb/", bpbHeader.nomor, ccData.NamaFile);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          hashedFile = crypto.createHash("sha256").update(fileBuffer).digest("hex");
        }
      }
      const cc = BpbCcModel.createFromType(ccData);
      cc.hashedFile = hashedFile;
      return cc;
    }));
    bpbHeader.noteList.push(...data.BpbNote.map(note => BpbNoteModel.createFromType(note)));
    return bpbHeader;
  };

  // Method for creating new BPB data by using the current BpbHeader object instance. This method accept
  // an optional parameter with type of database transaction from Prisma. It will use the transaction instance
  // to execute the operation if the parameter is provided or plain prisma instance with no transaction if isn't.
  insertHeader = async (tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.bpbHeader.create({
      data: this.createAsType()
    });
  };
  
  // Method for updating BPB data by using the current BpbHeader object instance. This method accept
  // an optional parameter with type of database transaction from Prisma. It will use the transaction instance
  // to execute the operation if the parameter is provided or plain prisma instance with no transaction if isn't.
  updateHeader = async (tx?: Prisma.TransactionClient) => {
    const client = tx ?? prisma;
    return client.bpbHeader.update({
      where: { Nomor: this.nomor },
      data: this.createAsType()
    });
  };
}

export default BpbHeaderModel;
