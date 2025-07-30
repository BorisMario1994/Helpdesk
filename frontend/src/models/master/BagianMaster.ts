import api from "../../api";

class BagianMaster {
  readonly code: string;
  readonly descrption: string;
  readonly isActive: boolean;
  readonly upperBagianCode: string | null;
  readonly treeLevel: number;

  // Constructor for Bagian Class
  constructor(code: string = "", description: string = "", isActive: boolean = false, upperBagianCode: string | null = null, treeLevel: number = 0) {
    this.code = code;
    this.descrption = description;
    this.isActive = isActive;
    this.upperBagianCode = upperBagianCode;
    this.treeLevel = treeLevel;
  };

  // Method to get list of Bagian data from backend, with optional parameter "allActive" to filter the result from backend, 
  // whether includes all inactive division or department, or only returns active Bagian.
  static getBagianMasterList = async () => {
    const bagianListData = await api.apiInstance.get("/bagian-master");
    return bagianListData.data;
  }

  // Method to send POST request to backend to create a new Bagian record in database. 
  createBagianMasterData = async() => api.apiInstance.post("/bagian-master", { data: this });

  // Method to send PUT request to backend to update an existing Bagian record in database. 
  updateBagianMasterData = async() => api.apiInstance.put(`/bagian-master/${this.code}`, { data: this });
};

export default BagianMaster;
