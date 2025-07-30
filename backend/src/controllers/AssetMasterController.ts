// import AppError from "../models/AppError";
import AssetMaster from "../models/master/AssetMaster";

export default {
  // Function to get list of Aktiva Master data from database, called using the static method provided from the AktivaMaster class
  getAssetMasterList: async () => {
    return AssetMaster.getAssetMasterList();
  },

  /*
  // Function to create AktivaMaster data by checking the availability of "code" provided by requester before inserting it.
  // Insert method is available for objects of AktivaMaster class. If the "code" exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createAktivaMaster: async (data: AktivaMaster) => {
    if (await AktivaMaster.checkKodeAktivaAvailability(data.kodeAktiva)) {
      const aktivaMasterData = new AktivaMaster(data.kodeAktiva, data.hardwareCode, data.descrption, data.merk, data.remarks, data.tanggalPembelian, data.batasGaransi, data.tanggalAfkir);
      return aktivaMasterData.createAktivaMaster();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update Aktiva Master data by creating the Aktiva Master object and call its corresponding method to update data. 
  updateAktivaMaster: async (kodeAktiva: string, data: AktivaMaster) => {
    const aktivaMasterData = new AktivaMaster(kodeAktiva, data.hardwareCode, data.descrption, data.merk, data.remarks, data.tanggalPembelian, data.batasGaransi, data.tanggalAfkir);
    return aktivaMasterData.updateAktivaMaster();
  }
  */
};
