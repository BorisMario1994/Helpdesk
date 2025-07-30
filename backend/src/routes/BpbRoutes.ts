import express from "express";
import HelpdeskController from "../controllers/HelpdeskController";
import { upload } from "../middleware/multer";
import fs from "fs";
import path from "path";
import AppError from "../models/AppError";
import { uploadFile, deleteFile } from "../FileHandler";
import BpbController from "../controllers/BpbController";
import BpbHeaderModel from "../models/bpb/BpbHeader";

const bpbRouter = express.Router();
bpbRouter.use(express.json());

// Route to get notifications of BPB app or other apps. 
bpbRouter.get("/notif", async (req, res) => {
	try {
		const notificationList = await BpbController.getNotificationList(res.locals.user.username);
		res.status(200).send(notificationList)
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving BPB list data." });
	}
});
/*
bpbRouter.get("/test", async(req, res) => {
	const test = await BpbHeaderModel.test();
	res.status(200).send(test);
})
*/

// Route to get a record of BPB based on BPB number passed as parameter in client's request. 
bpbRouter.get("/:nomor", async (req, res) => {
	try {
		const bpb = await BpbController.getBpbByNumber(req.params.nomor);
		res.status(200).send(bpb);
	} catch(err: any) {
		console.error(err);
		(err instanceof AppError && err.customErrorName === "RecordNotExists")
		? res.status(404).send({ success: false, name: "RecordNotExists", message: "Data not found." })
		: res.status(500).send({ success: true, name: "InternalServerError", message: "Failed on retrieving BPB data." });
	}
});

// Route to get list of BPB based on category. 
bpbRouter.get("/list/:type", async (req, res) => {
	try {
		const bpbList = await BpbController.getBpbList(res.locals.user.username, req.params.type);
		res.status(200).send(bpbList);
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving BPB list data." });
	}
});

// Route to create new BPB record. 
bpbRouter.post("/", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const nomor = await BpbController.createBpb(data);
		if (req.file)
			await uploadFile(req, "bpb", nomor);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB created successfully", nomor: nomor });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating BPB data." });
	}
});

// Route to update existing BPB record after revision made by publisher. 
bpbRouter.put("/:nomor/revision", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const note = data.note;
		if (req.file || data.namaFile.length <= 0) {
			const oldBpb = await BpbController.getBpbByNumber(data.nomor);
			if (oldBpb.namaFile.length > 0)
				await deleteFile("bpb", data.nomor, oldBpb.namaFile);

			if (req.file) {
				const newFileName = await uploadFile(req, "bpb", data.nomor);
				data.namaFile = newFileName;
			}
		}

		await BpbController.reviseBpb(data, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB revision updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating the revision of BPB data." });
	}
});

bpbRouter.post("/:nomor/note/:type", async (req, res) => {
	try {
		const note = req.body.data;
		await BpbController.updateBpbNote(req.params.nomor, req.params.type, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB note added successfully." });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on adding the note to the BPB." });
	}
});

// Route to update BPB and return to CC or recipient after response from publisher's div / dept head is given for, usually, 
// comments or questions from GMG. 
bpbRouter.put("/:nomor/revision-dept-head", upload.single("file"), async (req, res) => {
	try {
		const note = req.body.data;
		await BpbController.updateBpbReplyComment(req.params.nomor, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB revision updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating the revision of BPB data." });
	}
});

// Route to update a CC record of a BPB after feedback is given by CC. 
bpbRouter.put("/:nomor/cc/:linenum/feedback", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const note = data.note;
		if (req.file || data.namaFile.length <= 0) {
			const oldBpb = await BpbController.getBpbByNumber(req.params.nomor);
			if (oldBpb.ccList[data.linenum].namaFile.length > 0) 
				await deleteFile("bpb", req.params.nomor, oldBpb.ccList[data.linenum].namaFile);

			if (req.file) {
				const newFileName = await uploadFile(req, "bpb", req.params.nomor);
				data.namaFile = newFileName;
			}
		}
		await BpbController.updateCcFeedback(req.params.nomor, data, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB feedback submitted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on submitting BPB feedback data." })
	}
});

bpbRouter.put("/:nomor/cc/reply-review", async (req, res) => {
	try {
		const note = req.body.data;
		await BpbController.replyForReview(req.params.nomor, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "BPB feedback submitted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on submitting BPB reply for requested review." })
	}
});

bpbRouter.delete("/:nomor/notif/:username", async (req, res) => {
	try {
		await HelpdeskController.deleteNotification(req.params.nomor, req.params.username);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk notification deleted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on deleting Helpdesk Notification data." });
	}
})

// Route to download file.  
bpbRouter.get("/download/:nomor/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/bpb", req.params.nomor, req.params.filename);
	
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'File not found' });
		return;
  }

  res.download(filePath, req.params.filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

export default bpbRouter;
