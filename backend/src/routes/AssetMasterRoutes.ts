import express from "express";
import AktivaMasterController from "../controllers/AssetMasterController";
import AppError from "../models/AppError";

const aktivaMasterRouter = express.Router();
aktivaMasterRouter.use(express.json());

// Route to get list of Aktiva Master records in database. 
aktivaMasterRouter.get("/", async (req, res) => {
  try {
    const aktivaMasterList = await AktivaMasterController.getAssetMasterList();
    res.status(200).send(aktivaMasterList);
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Aktiva Master list data." });
  }
});

/*
// Route to create new Aktiva Master record. 
aktivaMasterRouter.post("/", async (req, res) => {
  try {
    const data = req.body.data;
    await AktivaMasterController.createAktivaMaster(data);
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Aktiva Master data created successfully." });
  } catch(err) {
    console.error(err);
    (err instanceof AppError && err.customErrorName === "RecordExists") 
    ? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created." })
    : res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Aktiva Master data." }); 
  }
});

// Route to update existing Aktiva Master record. 
aktivaMasterRouter.put("/:kodeAktiva", async (req, res) => {
  try {
    const data = req.body.data;
    await AktivaMasterController.updateAktivaMaster(req.params.kodeAktiva, data); 
    res.status(200).send({ success: true, name: "RequestSuccess", message: "Aktiva Master data updated successfully." });
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Aktiva Master data." });
  }
});
*/

export default aktivaMasterRouter;
