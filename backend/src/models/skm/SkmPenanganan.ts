import { SkmPenanganan } from "../../../generated/prisma";
import prisma from "../../PrismaConnection";
import SkmVerificationModel from "./SkmVerification";

class SkmPenangananModel {
  readonly linenum: number;
  readonly bagian: string;
  readonly al: string;
  readonly aal: string;
  penyebab: string = "";
  koreksi: string = "";
  pencegahan: string = "";
  tsKoreksi: Date = new Date("1900-01-01");
  tsPencegahanApplied: Date = new Date("1900-01-01");
  tsPencegahanVerified: Date = new Date("1900-01-01");
  statusApplied: string = "";
  statusVerified: string = "";
  tanggalTerima: Date = new Date("1900-01-01");
  tanggalKembali: Date = new Date("1900-01-01");
  tanggalSelesai: Date = new Date("1900-01-01");
  pic: string = "";
  namaFile: string = "";
  keteranganInfoKeSupplier: string = "";
  alasanPerpanjanganTs: string = "";
  closingEvidence: string = "";
  progressUpdate: string = "";
  hasilVerifikasi: string = "";
  verificationList: SkmVerificationModel[] = [];

  constructor(linenum: number, bagian: string, al: string, aal: string) {
    this.linenum = linenum;
    this.bagian = bagian;
    this.al = al;
    this.aal = aal;
  }

  static createFromType(penanganan: SkmPenanganan) {
    const skmPenanganan = new SkmPenangananModel(penanganan.LineNum, penanganan.Bagian, penanganan.AL, penanganan.AAL);
    skmPenanganan.penyebab = penanganan.Penyebab;
    skmPenanganan.koreksi = penanganan.Koreksi;
    skmPenanganan.pencegahan = penanganan.Pencegahan;
    skmPenanganan.tsKoreksi = penanganan.TS_Koreksi;
    skmPenanganan.tsPencegahanApplied = penanganan.TS_Pencegahan_Applied;
    skmPenanganan.tsPencegahanVerified = penanganan.TS_Pencegahan_Verified;
    skmPenanganan.statusApplied = penanganan.StatusApplied;
    skmPenanganan.statusVerified = penanganan.StatusVerified;
    skmPenanganan.tanggalTerima = penanganan.TanggalTerima;
    skmPenanganan.tanggalKembali = penanganan.TanggalKembali;
    skmPenanganan.tanggalSelesai = penanganan.TanggalSelesai;
    skmPenanganan.pic = penanganan.PIC;
    skmPenanganan.namaFile = penanganan.NamaFile;
    skmPenanganan.keteranganInfoKeSupplier = penanganan.KeteranganInfoKeSupplier;
    skmPenanganan.alasanPerpanjanganTs = penanganan.AlasanPerpanjanganTS;
    skmPenanganan.closingEvidence = penanganan.ClosingEvidence;
    skmPenanganan.progressUpdate = penanganan.ProgressUpdate;
    skmPenanganan.hasilVerifikasi = penanganan.HasilVerifikasi;
    return skmPenanganan;
  };

  createAsType = (nomor: string) => {
    const data: SkmPenanganan = {
      Nomor: nomor,
      LineNum: this.linenum,
      Bagian: this.bagian,
      AL: this.al,
      AAL: this.aal,
      Penyebab: this.penyebab,
      Koreksi: this.koreksi,
      Pencegahan: this.pencegahan,
      TS_Koreksi: this.tsKoreksi,
      TS_Pencegahan_Applied: this.tsPencegahanApplied,
      TS_Pencegahan_Verified: this.tsPencegahanVerified,
      StatusApplied: this.statusApplied,
      StatusVerified: this.statusVerified,
      TanggalTerima: this.tanggalTerima,
      TanggalKembali: this.tanggalKembali,
      TanggalSelesai: this.tanggalSelesai,
      PIC: this.pic,
      NamaFile: this.namaFile,
      KeteranganInfoKeSupplier: this.keteranganInfoKeSupplier,
      AlasanPerpanjanganTS: this.alasanPerpanjanganTs,
      ClosingEvidence: this.closingEvidence,
      ProgressUpdate: this.progressUpdate,
      HasilVerifikasi: this.hasilVerifikasi
    };
    return data;
  };

  static getSkmPenangananList = async (nomor: string) => {
    const data = await prisma.skmPenanganan.findMany({
      where: { Nomor: nomor },
      include: { SkmVerification: true }
    });

    return data.map(penanganan => {
      const verificationList = penanganan.SkmVerification.map(verification => SkmVerificationModel.createFromType(verification));
      const newPenanganan = this.createFromType(penanganan);
      newPenanganan.verificationList = verificationList;
      return newPenanganan;
    });
  }
};

export default SkmPenangananModel;
