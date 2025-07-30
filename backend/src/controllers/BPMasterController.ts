import BPMaster from "../models/master/BPMaster";

export default {
  getBPMasterList: async () => {
    return BPMaster.getBPMasterList();
  },
};
