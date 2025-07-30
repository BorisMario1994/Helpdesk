import AppError from "../models/AppError";
import OrderMaster from "../models/master/OrderMaster";

export default {
  // Function to get list of Order Master data from database, called using the static method provided from the OrderMaster class
  getOrderMasterList: async () => {
    return OrderMaster.getOrderMasterList();
  },

  // Function to create OrderMaster data by checking the availability of "code" provided by requester before inserting it.
  // Insert method is available for objects of OrderMaster class. If the "code" exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createOrderMaster: async (data: OrderMaster) => {
    if (await OrderMaster.checkOrderCodeAvailability(data.code)) {
      const orderMasterData = new OrderMaster(data.code, data.descrption, data.isActive);
      return orderMasterData.createOrderMaster();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update Order Master data by creating the Order Master object and call its corresponding method to update data. 
  updateOrderMaster: async (code: string, data: OrderMaster) => {
    const orderMasterData = new OrderMaster(code, data.descrption, data.isActive);
    return orderMasterData.updateOrderMaster();
  }
};
