import AppError from "../models/AppError";
import MasterMasalahPkp from "../models/master/MasterMasalahPKP";

export default {
  // Function to get list of Master Masalah PKP data from database, called using the static method provided from the MasterMasalahPKP class
  getMasterMasalahPKPList: async () => {
    return MasterMasalahPkp.getMasterMasalahPkpList();
  },

  // Function to create MasterMasalahPKP data by checking the availability of "masalah" provided by requester before inserting it.
  // Insert method is available for objects of MasterMasalahPKP class. If the "masalah" exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createMasterMasalahPKP: async (data: MasterMasalahPkp) => {
    if (!(await MasterMasalahPkp.getMasterMasalahPKPByName(data.masalah))) {
      const masterMasalahPkpData = new MasterMasalahPkp(await MasterMasalahPkp.generateLatestNumber(), data.masalah, data.isActive);
      return await masterMasalahPkpData.createMasterMasalahPKP();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update MasterMasalahPKP data by creating the MasterMasalahPKP object and call its corresponding method to update data. 
  updateMasterMasalahPKP: async (code: number, data: MasterMasalahPkp) => {
    const getMasterMasalahPkp = await MasterMasalahPkp.getMasterMasalahPKPByName(data.masalah)
    if (!getMasterMasalahPkp || getMasterMasalahPkp.Code === code) {
      const masterMasalahPkpData = new MasterMasalahPkp(code, data.masalah, data.isActive);
      return await masterMasalahPkpData.updateMasterMasalahPKP();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  }
};
