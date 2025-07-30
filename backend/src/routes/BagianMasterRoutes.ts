import express from "express";
import BagianMasterController from "../controllers/BagianMasterController";
import AppError from "../models/AppError";

const bagianMasterRouter = express.Router();
bagianMasterRouter.use(express.json());

// Route to get list of Bagian Master records in database. 
bagianMasterRouter.get("/", async (req, res) => {
	try {
		const bagianList = await BagianMasterController.getBagianList();
		res.status(200).send(bagianList);
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Bagian Master list data." });
	}
});

// Route to create new Bagian Master record. 
bagianMasterRouter.post("/", async (req, res) => {
	try {
		const data = req.body.data;
		await BagianMasterController.createBagianMaster(data);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Bagian data created successfully" });
	} catch(err) {
		console.error(err);
		(err instanceof AppError && err.customErrorName === "RecordExists") 
		? res.status(409).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created." })
		: res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Bagian Master data." });
	}
});

// Route to update existing Bagian Master record. 
bagianMasterRouter.put("/:code", async (req, res) => {
	try {
		const data = req.body.data;
		await BagianMasterController.updateBagianMaster(req.params.code, data);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Bagian Master data updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Bagian Master data." });
	}
});

export default bagianMasterRouter;

