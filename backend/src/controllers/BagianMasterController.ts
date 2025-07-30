import AppError from "../models/AppError";
import BagianMaster from "../models/master/BagianMaster";

// All function will have results return directly to router from class methods and no error catchers defined, so if there are some error occurs, 
// it will return the error also directly to router and the router would return error code to client.

export default {
  // Function to get list of Bagian Master data from database, called using the static method provided from the BagianMaster class
  getBagianList: async () => {
    return BagianMaster.getBagianMasterList();
  },

  // Function to create Bagian Master data by checking the availability of "code" provided by requester before inserting it.
  // Insert method is available for objects of BagianMaster class. If the "code" is exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createBagianMaster: async (data: BagianMaster) => {
    if (await BagianMaster.checkBagianCodeAvailability(data.code)) {
      const bagianMasterData = new BagianMaster(data.code, data.descrption, data.isActive, data.upperBagianCode);
      return bagianMasterData.createBagianMaster();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update Bagian Master data by creating the BagianMaster object and call its corresponding method to update data. 
  updateBagianMaster: async (code: string, data: BagianMaster) => {
    const bagianMasterData = new BagianMaster(code, data.descrption, data.isActive, data.upperBagianCode);
    return bagianMasterData.updateBagianMaster();
  }
};
