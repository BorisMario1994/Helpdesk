import express from "express";
import BPMasterController from "../controllers/BPMasterController";

const bpMasterRouter = express.Router();
bpMasterRouter.use(express.json());

// Route to get list of Aktiva Master records in database. 
bpMasterRouter.get("/", async (req, res) => {
  try {
    const bpMasterList = await BPMasterController.getBPMasterList();
    res.status(200).send(bpMasterList);
  } catch(err) {
    console.error(err);
    res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving BP Master list data." });
  }
});

export default bpMasterRouter;
