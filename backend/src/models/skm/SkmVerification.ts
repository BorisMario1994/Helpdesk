import { SkmVerification } from "../../../generated/prisma";

class SkmVerificationModel {
  readonly phase: number;
  readonly linenum: number;
  readonly verificator: string;
  readonly bagian: string;
  readonly verified: string;
  tanggalVerif: Date = new Date("1900-01-01");
  namaFile: string = "";

  constructor(phase: number, linenum: number, verificator: string, bagian: string, verified: string) {
    this.phase = phase;
    this.linenum = linenum;
    this.verificator= verificator;
    this.bagian = bagian;
    this.verified = verified;
  }

  static createFromType(verification: SkmVerification) {
    const skmVerification = new SkmVerificationModel(verification.Phase, verification.LineNum, verification.Verificator, verification.Bagian, verification.Verified);
    skmVerification.tanggalVerif = verification.TanggalVerif;
    skmVerification.namaFile = verification.NamaFile;
    return skmVerification;
  };

  createAsType = (nomor: string, lineNumPenanganan: number) => {
    const data: SkmVerification = {
      Nomor: nomor,
      LineNumPenanganan: lineNumPenanganan,
      Phase: this.phase,
      LineNum: this.linenum,
      Verificator: this.verificator,
      Bagian: this.bagian,
      Verified: this.verified,
      TanggalVerif: this.tanggalVerif,
      NamaFile: this.namaFile
    };
    return data;
  };
}

export default SkmVerificationModel;
