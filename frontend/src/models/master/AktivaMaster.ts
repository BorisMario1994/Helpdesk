import api from "../../api";

class AktivaMaster {
  readonly kodeAktiva: string;
  readonly descrption: string;

  /*
  readonly hardwareCode: string;
  readonly merk: string;
  readonly remarks: string;
  tanggalPembelian: Date;
  batasGaransi: Date;
  tanggalAfkir: Date;
  */

  constructor(kodeAktiva: string = "", descrption: string = "") {
    this.kodeAktiva = kodeAktiva;
    this.descrption = descrption;
  };

  /*
  // Constructor for Aktiva Master Class
  constructor(kodeAktiva: string = "", hardwareCode: string = "", descrption: string = "", merk: string = "", remarks: string = "", tanggalPembelian: Date = new Date("1900-01-01"), batasGaransi: Date = new Date("1900-01-01"), tanggalAfkir: Date = new Date("1900-01-01")) {
    this.kodeAktiva = kodeAktiva;
    this.hardwareCode = hardwareCode;
    this.descrption = descrption;
    this.merk = merk;
    this.remarks = remarks;
    this.tanggalPembelian = tanggalPembelian;
    this.batasGaransi = batasGaransi;
    this.tanggalAfkir = tanggalAfkir;
  };
  */  

  static getAktivaMasterList = async() => {
    const aktivaMasterList = (await (api.apiInstance.get("/aktiva-master"))).data as AktivaMaster[];
    return aktivaMasterList;
  }; 

  /*
  // Method to get list of Aktiva Master data from backend. 
  static getAktivaMasterList = async() => {
    const aktivaMasterList = (await (api.apiInstance.get("/aktiva-master"))).data as AktivaMaster[];
    aktivaMasterList.forEach(aktiva => {
      aktiva.tanggalPembelian = new Date(aktiva.tanggalPembelian);
      aktiva.batasGaransi = new Date(aktiva.batasGaransi);
      aktiva.tanggalAfkir = new Date(aktiva.tanggalAfkir);
    });
    return aktivaMasterList;
  }; 

  // Method to send POST request to backend to create a new Aktiva Master record in database. 
  createAktivaMasterData = async() => api.apiInstance.post("/aktiva-master", { data: this });

  // Method to send PUT request to backend to update an existing Aktiva Master record in database. 
  updateAktivaMasterData = async() => api.apiInstance.put(`/aktiva-master/${this.kodeAktiva}`, { data: this });
  */
};

export default AktivaMaster;
