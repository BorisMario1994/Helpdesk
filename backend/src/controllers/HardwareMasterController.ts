import AppError from "../models/AppError";
import HardwareMaster from "../models/master/HardwareMaster";

export default {
  // Function to get list of Hardware Master data from database, called using the static method provided from the HardwareMaster class
  getHardwareMasterList: async () => {
    return HardwareMaster.getHardwareMasterList();
  },

  // Function to create HardwareMaster data by checking the availability of "code" provided by requester before inserting it.
  // Insert method is available for objects of HardwareMaster class. If the "code" exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createHardwareMaster: async (data: HardwareMaster) => {
    if (await HardwareMaster.checkHardwareCodeAvailability(data.code)) {
      const hardwareMasterData = new HardwareMaster(data.code, data.descrption, data.isActive);
      return hardwareMasterData.createHardwareMaster();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update Hardware Master data by creating the Hardware Master object and call its corresponding method to update data. 
  updateHardwareMaster: async (code: string, data: HardwareMaster) => {
    const hardwareMasterData = new HardwareMaster(code, data.descrption, data.isActive);
    return hardwareMasterData.updateHardwareMaster();
  }
};
