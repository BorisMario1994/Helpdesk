import api from "../../api";

class MasterMasalahPkp {
  readonly code: number;
  readonly masalah: string;
  readonly isActive: boolean;
  
  // Constructor for Master Masalah PKP Class
  constructor(code: number = -1, masalah: string = "", isActive: boolean = false) {
    this.code = code;
    this.masalah = masalah;
    this.isActive = isActive;
  };

  // Method to get list of Master Masalah PKP data from backend. 
  static getMasterMasalahPkpList = async() => (await api.apiInstance.get("/pkp/master-masalah")).data as MasterMasalahPkp[];

  // Method to send POST request to backend to create a new User record in database. 
  createMasterMasalahPkpList = async() => api.apiInstance.post("/pkp/master-masalah", { data: this });

  // Method to send PUT request to backend to update an existing Master Masalah PKP record in database. 
  updateMasterMasalahPkpList = async() => api.apiInstance.put(`/pkp/master-masalah/${this.code}`, { data: this });
};

export default MasterMasalahPkp;
