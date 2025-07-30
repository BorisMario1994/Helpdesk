import express from "express";
import MasterMasalahPKPController from "../controllers/MasterMasalahPKPController";
import AppError from "../models/AppError";

const masterMasalahPKPRouter = express.Router();
masterMasalahPKPRouter.use(express.json());

// Route to get list of Master Masalah PKP records in database. 
masterMasalahPKPRouter.get("/", async (req, res) => {
  try {
    const masterMasalahPkpList = await MasterMasalahPKPController.getMasterMasalahPKPList();
    res.status(200).send(masterMasalahPkpList);
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Master Masalah PKP list data." });
  }
});

// Route to create new Master Masalah PKP record. 
masterMasalahPKPRouter.post("/", async (req, res) => {
  try {
    const data = req.body.data;
    await MasterMasalahPKPController.createMasterMasalahPKP(data);
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Master Masalah PKP created successfully" });
  } catch(err) {
    console.error(err);
    (err instanceof AppError && err.customErrorName === "RecordExists") 
    ? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created" })
    : res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Master Masalah PKP data." });
  }
});

// Route to update existing Master Masalah PKP record. 
masterMasalahPKPRouter.put("/:code", async (req, res) => {
  try {
    const data = req.body.data;
    await MasterMasalahPKPController.updateMasterMasalahPKP(Number(req.params.code), data) ;
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Master Masalah PKP data updated successfully" });
  } catch(err) {
    console.error(err);
    (err instanceof AppError && err.customErrorName === "RecordExists") 
    ? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, data can\'t be updated" })
    : res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Master Masalah PKP data." });
  }
});

export default masterMasalahPKPRouter;
