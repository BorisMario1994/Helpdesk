import express from "express";
import AuthenticationController from "../controllers/AuthenticationController";

const authenticationRouter = express.Router();
authenticationRouter.use(express.json());

// Route to log user into the app. 
authenticationRouter.post("/login", async (req, res) => {
	let data = req.body.data;
  let username = data.username;
  let password = data.password;
	// let username = Buffer.from(data.username, "base64").toString("utf8")
	// let password = Buffer.from(data.password, "base64").toString("utf8")
  try {
    const token = await AuthenticationController.login(username, password)
    res.cookie("refreshToken", token.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json(token.access_token);
  } catch(err: any) {
    (err.customErrorName === "AuthenticationFailed" || err.customErrorName === "UserNotExists")
    ? res.status(401).send({ success: false, name: "AuthenticationFailed", message: "Credentials is invalid" })
    : res.status(500).send({ success: false, message: "InternalServerError" });
  }
});

// Route to refresh access token for user after they lost their token or the token is expired. 
authenticationRouter.post("/refresh", (req, res) => {
  const username = req.body.username;
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) {
		res.status(403).send({ success: false, name: "AuthorizationFailed", message: "Authorization data not provided" })
    return;
  }


  AuthenticationController.refresh(refreshToken, username)
  .then(result => {
    res.status(200).send(result)
  })
  .catch(err => {
    if (err.name === "TokenExpiredError")
      return res.status(403).send({ success: false, name: "TokenInvalid", message: "TokenInvalid" });
    res.status(500).send({ success: false, name: "ServerProcessFailed", message: "processing data error occured" });
  })
});

// Route to log user out of the application. 
authenticationRouter.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).send({ success: true, message: "successfully logout from account" });
});

export default authenticationRouter;
