import express from "express";
import OrderMasterController from "../controllers/OrderMasterController";
import AppError from "../models/AppError";

const orderMasterRouter = express.Router();
orderMasterRouter.use(express.json());

// Route to get list of Order Master records in database. 
orderMasterRouter.get("/", async (req, res) => {
  try {
    const orderMasterList = await OrderMasterController.getOrderMasterList();
    res.status(200).send(orderMasterList);
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Order Master list data." });
  }
});

// Route to create new Order Master record. 
orderMasterRouter.post("/", async (req, res) => {
  try {
    const data = req.body.data;
    await OrderMasterController.createOrderMaster(data);
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Order Master data created successfully." });
  } catch(err) {
    console.error(err);
    (err instanceof AppError && err.customErrorName === "RecordExists") 
    ? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created." })
    : res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Order Master data." }); 
  }
});

// Route to update existing Order Master record. 
orderMasterRouter.put("/:code", async (req, res) => {
  try {
    const data = req.body.data;
    await OrderMasterController.updateOrderMaster(req.params.code, data); 
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Order Master data updated successfully." });
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Order Master data." });
  }
});

export default orderMasterRouter;
