import express from "express";
import HardwareMasterController from "../controllers/HardwareMasterController";
import AppError from "../models/AppError";

const hardwareMasterRouter = express.Router();
hardwareMasterRouter.use(express.json());

// Route to get list of Hardware Master records in database. 
hardwareMasterRouter.get("/", async (req, res) => {
  try {
    const hardwareMasterList = await HardwareMasterController.getHardwareMasterList();
    res.status(200).send(hardwareMasterList);
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Hardware Master list data." });
  }
});

// Route to create new Hardware Master record. 
hardwareMasterRouter.post("/", async (req, res) => {
  try {
    const data = req.body.data;
    await HardwareMasterController.createHardwareMaster(data);
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Hardware Master data created successfully." });
  } catch(err) {
    console.error(err);
    (err instanceof AppError && err.customErrorName === "RecordExists") 
    ? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created." })
    : res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Hardware Master data." }); 
  }
});

// Route to update existing Hardware Master record. 
hardwareMasterRouter.put("/:code", async (req, res) => {
  try {
    const data = req.body.data;
    await HardwareMasterController.updateHardwareMaster(req.params.code, data); 
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Hardware Master data updated successfully." });
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Hardware Master data." });
  }
});

export default hardwareMasterRouter;
