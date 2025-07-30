import api from "../../api";

class BPMaster {
  readonly cardCode: string;
  readonly cardName: string;
  readonly cardType: string;
  readonly street: string;

  constructor(cardCode: string, cardName: string, cardType: string, street: string) {
    this.cardCode = cardCode;
    this.cardName = cardName;
    this.cardType = cardType;
    this.street = street;
  };

  static getBPMasterList = async() => {
    const bpMasterList = (await (api.apiInstance.get("/bp-master"))).data as BPMaster[];
    return bpMasterList;
  }; 
};

export default BPMaster;
