import prisma from "../../PrismaConnection";
// import { HelpdeskAktiva } from "../../../generated/prisma";

// AktivaMaster class is used for encapsulating Aktiva Master properties with all of its method for creating, updating or retrieving data from database. 
// It is created based on HelpdeskAktivaMaster table structure in database and to align with the type created by Prisma ORM. 
class BPMaster {
  readonly cardCode: string;
  readonly cardName: string;
  readonly cardType: string;
  readonly street: string;

  // Constructor for initializing AktivaMaster class.
  constructor(cardCode: string, cardName: string, cardType: string, street: string) {
    this.cardCode = cardCode;
    this.cardName = cardName;
    this.cardType = cardType;
    this.street = street;
  };  

  static getBPMasterList = async () => {
    const bpMasterList: { CardCode: string, CardName: string, CardType: string, Street: string }[] = await prisma.$queryRaw`SELECT DISTINCT A.CardCode, A.CardName, A.CardType COLLATE Latin1_General_CI_AS AS CardType, B.Street FROM SAPHCL.HOCK.DBO.OCRD A INNER JOIN SAPHCL.HOCK.DBO.CRD1 B ON A.CardCode = B.CardCode WHERE ISNULL(B.Street, '') <> ''`;

    return bpMasterList.map(bp => new BPMaster(bp.CardCode, bp.CardName, bp.CardType, bp.Street));
  };
}

export default BPMaster;
