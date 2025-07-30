import express from "express";
import cookieParser from "cookie-parser";
import UserController from "../controllers/UserController";
import AppError from "../models/AppError";

const userRouter = express.Router();
userRouter.use(express.json());
userRouter.use(cookieParser());

// Route to get list of users registered in the system. 
userRouter.get("/", async (req, res) => {
	try {
		const userList = await UserController.getUserList();
		res.status(200).send(userList);
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving User list data." });
	}
});

userRouter.get("/adjusted-superior", async (req, res) => {
	try {
		const userList = await UserController.getUserListAdjustedSuperior();
		res.status(200).send(userList);
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving User list data." })
	}
})

// Route to get username of division / department head of the username sent by client. 
userRouter.get("/:username/dept-head", async (req, res) => {
	try {
		const deptHeadUsername = await UserController.getUserDeptHead(req.params.username);
		res.status(200).send({ user: deptHeadUsername });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on retrieving User Dept Head data." });
	}
});

// Route to create new User data. 
userRouter.post("/", async (req, res) => {
	try {
		const data = req.body.data;
		await UserController.createUser(data);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "User data created successfully" });
	} catch(err) {
		console.error(err);
		(err instanceof AppError && err.customErrorName === "RecordExists") 
		? res.status(403).send({ success: false, name: "RecordExists", message: "Record exists, new data can\'t be created" })
		: res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on creating User data." });
	}
});

// Route to update existing user's data. 
userRouter.put("/:username", async (req, res) => {
	try {
		const data = req.body.data;
		await UserController.updateUser(req.params.username, data);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "User data updated successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on updating User data." });
	}
});

// Route to reset user's password to default for username sent by client. 
userRouter.put("/:username/reset-password", async (req, res) => {
	try {
		await UserController.resetPassword(req.params.username)
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Reset password successfully" });
	} catch(err) {
		console.error(err);
		res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on resetting User's password." });
	}
});
    
// Route to change user's password for with credentials send by client. 
userRouter.put("/:username/change-password", async (req, res) => {
	try {
		const data = req.body.data;
		await UserController.changePassword(req.params.username, data.oldPassword, data.newPassword);
		res.status(200).send({ success: true, name: "RequestSuccess", message: "Password changed successfully" });
	} catch(err) {
		console.error(err);
		(err instanceof AppError && err.customErrorName === "AuthenticationFailed") 
		? res.status(401).send({ success: false, name: "AuthenticationFailed", message: "Credentials is invalid" })
		: res.status(500).send({ success: false, name: "InternalServerError", message: "Failed on changing User's password." });
	}
});

export default userRouter;
