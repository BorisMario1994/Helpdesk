import User from "../models/master/User";
import jwt, { SignOptions } from "jsonwebtoken";
import { readFileSync } from "fs";

const pvt: string = readFileSync("./private.key", "utf8");
const pbc = readFileSync("./public.key", "utf8");

type TokenPayload = {
  user: User;
  scope: User;
};

const signOptions : SignOptions = {
  issuer: "Helpdesk PT Hokinda Citralestari",
  audience: "http://localhost:3000/api-hock-helpdesk",
  algorithm: "RS256"
};

// Function to generate new access token. 
const generateAccessToken = (payload: TokenPayload) => {
  let generatedSignOptions: SignOptions = { ...signOptions, subject: payload.user.username, expiresIn: "10m" };
  return jwt.sign(payload, pvt, generatedSignOptions);
};

// Function to generate new refresh token. 
const generateRefreshToken = (payload: TokenPayload) => {
  let generatedSignOptions: SignOptions = { ...signOptions, subject: payload.user.username, expiresIn: "1d" };
  return jwt.sign(payload, pvt, generatedSignOptions);
};

export default {
  // Function to do a login session for client by checking the credentials sent by client. 
  login: async (username: string, password: string) => {
    try {
      const user = await User.checkCredentials(username, password);
      if (user.username.substring(0, 4) === "MISW")
        await User.insertLog(user.username);
      const accessToken = generateAccessToken({ user: user, scope: user });
      const refreshToken = generateRefreshToken({ user: user, scope: user });

      return ({
        username: user.username,
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // Function to generate a new refresh token for clients having their access token expired. 
  refresh: async (refreshToken: string, username: string = "") => {
    try {
      const refreshPayload = jwt.verify(refreshToken, pbc) as TokenPayload;
      const newAccessToken = generateAccessToken({ user: refreshPayload.user, scope: username.length <= 0 ? refreshPayload.user : await User.getUserByUsername(username) });
      return newAccessToken;
    } catch(err) {
      console.error(err);
      throw err;
    }
  },

  // Function acts as authentication gates for each request made by client side to verify whether the token sent by client is 
  // a valid token and not expired yet.
  authenticate: async (token: string) => {
    try {
      return (jwt.verify(token, pbc) as TokenPayload).scope;
    } catch(err) {
      console.error(err);
      throw err;
    }
  }
};
