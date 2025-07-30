import api from "../../api";

class OrderMaster {
  readonly code: string;
  readonly descrption: string;
  readonly isActive: boolean;
  
  // Constructor for Order Master Class
  constructor(code: string = "", descrption: string = "", isActive: boolean = false) {
    this.code = code;
    this.descrption = descrption;
    this.isActive = isActive;
  };

  // Method to get list of Order Master data from backend. 
  static getOrderMasterList = async() => (await (api.apiInstance.get("/order-master"))).data as OrderMaster[];

  // Method to send POST request to backend to create a new Order Master record in database. 
  createOrderMasterData = async() => api.apiInstance.post("/order-master", { data: this });

  // Method to send PUT request to backend to update an existing Order Master record in database. 
  updateOrderMasterData = async() => api.apiInstance.put(`/order-master/${this.code}`, { data: this });
};

export default OrderMaster;
