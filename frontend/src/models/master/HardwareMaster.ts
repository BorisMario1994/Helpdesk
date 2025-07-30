import api from "../../api";

class HardwareMaster {
  readonly code: string;
  readonly descrption: string;
  readonly isActive: boolean;
  
  // Constructor for Hardware Master Class
  constructor(code: string = "", descrption: string = "", isActive: boolean = false) {
    this.code = code;
    this.descrption = descrption;
    this.isActive = isActive;
  };

  // Method to get list of Hardware Master data from backend. 
  static getHardwareMasterList = async() => (await (api.apiInstance.get("/hardware-master"))).data as HardwareMaster[];

  // Method to send POST request to backend to create a new Hardware Master record in database. 
  createHardwareMasterData = async() => api.apiInstance.post("/hardware-master", { data: this });

  // Method to send PUT request to backend to update an existing Hardware Master record in database. 
  updateHardwareMasterData = async() => api.apiInstance.put(`/hardware-master/${this.code}`, { data: this });
};

export default HardwareMaster;
