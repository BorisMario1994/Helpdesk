import express from "express";
import HelpdeskController from "../controllers/HelpdeskController";
import { upload } from "../middleware/multer";
import fs from "fs";
import path from "path";
import AppError from "../models/AppError";
import { uploadFile, deleteFile } from "../FileHandler";

const helpdeskRouter = express.Router();
helpdeskRouter.use(express.json());

// Route to get notifications of helpdesk app or other apps. 
helpdeskRouter.get("/notif", async (req, res) => {
	try {
		const notificationList = await HelpdeskController.getNotificationList(res.locals.user.username);
		res.status(200).send(notificationList)
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Helpdesk list data." });
	}
});

// Route to get a record of helpdesk based on helpdesk number passed as parameter in client's request. 
helpdeskRouter.get("/:nomor", async (req, res) => {
	try {
		const helpdesk = await HelpdeskController.getHelpdeskByNumber(req.params.nomor);
		res.status(200).send(helpdesk);
	} catch(err: any) {
		console.error(err);
		(err instanceof AppError && err.customErrorName === "RecordNotExists")
		? res.status(404).send({ success: false, name: "RecordNotExists", message: "Data not found." })
		: res.status(500).send({ success: true, name: "InternalServerError", message: "Failed on retrieving Helpdesk data." });
	}
});

// Route to get list of helpdesk based on category. 
helpdeskRouter.get("/list/:type", async (req, res) => {
	try {
		const helpdeskList = await HelpdeskController.getHelpdeskList(res.locals.user.username, req.params.type);
		res.status(200).send(helpdeskList);
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving Helpdesk list data." });
	}
});

// Route to create new helpdesk record. 
helpdeskRouter.post("/", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const nomor = await HelpdeskController.createHelpdesk(data);
		if (req.file)
			await uploadFile(req, "helpdesk", nomor);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk created successfully", nomor: nomor });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating Helpdesk data." });
	}
});

// Route to update existing helpdesk record after revision made by publisher. 
helpdeskRouter.put("/:nomor/revision", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const note = data.note;
		if (req.file || data.namaFile.length <= 0) {
			const oldHelpdesk = await HelpdeskController.getHelpdeskByNumber(data.nomor);
			if (oldHelpdesk.namaFile.length > 0)
				await deleteFile("helpdesk", data.nomor, oldHelpdesk.namaFile);

			if (req.file) {
				const newFileName = await uploadFile(req, "helpdesk", data.nomor);
				data.namaFile = newFileName;
			}
		}

		await HelpdeskController.reviseHelpdesk(data, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk revision updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating the revision of Helpdesk data." });
	}
});

helpdeskRouter.post("/:nomor/note/:type", async (req, res) => {
	try {
		const note = req.body.data;
		await HelpdeskController.updateHelpdeskNote(req.params.nomor, req.params.type, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk note added successfully." });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on adding the note to the Helpdesk." });
	}
});

// Route to update helpdesk and return to CC or recipient after response from publisher's div / dept head is given for, usually, 
// comments or questions from GMG. 
helpdeskRouter.put("/:nomor/revision-dept-head", upload.single("file"), async (req, res) => {
	try {
		const note = req.body.data;
		await HelpdeskController.updateHelpdeskReplyComment(req.params.nomor, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk revision updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating the revision of Helpdesk data." });
	}
});

// Route to update a CC record of a helpdesk after feedback is given by CC. 
helpdeskRouter.put("/:nomor/cc/:linenum/feedback", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const note = data.note;
		if (req.file || data.namaFile.length <= 0) {
			const oldHelpdesk = await HelpdeskController.getHelpdeskByNumber(req.params.nomor);
			if (oldHelpdesk.ccList[data.linenum].namaFile.length > 0) 
				await deleteFile("helpdesk", req.params.nomor, oldHelpdesk.ccList[data.linenum].namaFile);

			if (req.file) {
				const newFileName = await uploadFile(req, "helpdesk", req.params.nomor);
				data.namaFile = newFileName;
			}
		}
		await HelpdeskController.updateCcFeedback(req.params.nomor, data, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk feedback submitted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on submitting Helpdesk feedback data." })
	}
});

helpdeskRouter.put("/:nomor/cc/reply-review", async (req, res) => {
	try {
		const note = req.body.data;
		await HelpdeskController.replyForReview(req.params.nomor, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk feedback submitted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on submitting Helpdesk reply for requested review." })
	}
});

// Route to update all job registration and feedback from recipient of a helpdesk. 
helpdeskRouter.put("/:nomor/feedback", upload.single("file"), async (req, res) => {
	try {
		const data = JSON.parse(req.body.json);
		const feedback = data.feedback;
		const detailsList = data.detailsList;
		const note = data.note;
		if (req.file || data.namaFileKepada.length <= 0) {
			const oldHelpdesk = await HelpdeskController.getHelpdeskByNumber(req.params.nomor);
			if (oldHelpdesk.namaFileKepada.length > 0)
				await deleteFile("helpdesk", req.params.nomor, oldHelpdesk.namaFileKepada);

			if (req.file) {
				const newFileName = await uploadFile(req, "helpdesk", req.params.nomor);
				data.namaFileKepada = newFileName;
			}
		}
		await HelpdeskController.updateFeedback(req.params.nomor, feedback, data.namaFileKepada, detailsList, note);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk status updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Helpdesk status." });
	}
});

// Route to update all job registration after changes made by PIC. 
helpdeskRouter.put("/:nomor/job-reg/update", async (req, res) => {
	try {
		const data = req.body.data;
		await HelpdeskController.updateJobRegistration(req.params.nomor, data);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk Details updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Helpdesk Details data." });
	}
});

// Route to reopen a helpdesk. 
helpdeskRouter.put("/:nomor/reopen/:role", async (req, res) => {
	try {
		await HelpdeskController.reopenHelpdesk(req.params.nomor, req.params.role);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk reopen successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating Helpdesk Details data." });
	}
});

helpdeskRouter.delete("/:nomor/notif/:username", async (req, res) => {
	try {
		await HelpdeskController.deleteNotification(req.params.nomor, req.params.username);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Helpdesk notification deleted successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on deleting Helpdesk Notification data." });
	}
})

// Route to download file.  
helpdeskRouter.get("/download/:nomor/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/helpdesk", req.params.nomor, req.params.filename);
	
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'File not found' });
		return;
  }
 // console.log('tes')
  res.download(filePath, req.params.filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

export default helpdeskRouter;
