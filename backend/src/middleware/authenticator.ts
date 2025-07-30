import { NextFunction, Request, Response } from "express";
import AuthenticationController from "../controllers/AuthenticationController";
import AppError from "../models/AppError";

// Middleware to authorize every request made by client by checking the token sent together with the request before forwarding 
// it to the router handler.  
export const authenticator = async (req: Request, res: Response, next: NextFunction) => {
  if (["login", "refresh", "logout"].includes(req.path.split("/")[-1]))
    return next();

  let auth = req.headers.authorization;
  try {
    if (!auth || !auth.includes("Bearer", 0)) {
      let error = new AppError(new Error(), "AuthorizationFailed", "Authorization data not provided.");
      error.LogError();
      throw error;
    }

    let token = auth.substring(7);
    let user = await AuthenticationController.authenticate(token);
    res.locals.user = user;
    next();
  } catch(err) {
    if (err instanceof AppError)
      res.status(401).send({ name: err.customErrorName, message: err.customErrorMessage });
    else if (err instanceof Error && err.name === "TokenExpiredError")
      res.status(403).send({ name: "TokenExpired", message: "token expired error." });
    else
      res.status(500).send({ name: "ServerProcessFailed", message: "processing data error occured" });
  }
}