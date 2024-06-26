import { errorResponse, successResponse } from "../utils/response.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";

dotenv.config();
let refreshTokens = [];

export const authController = {
  register: async (req, res) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(req.body.password, salt);
      const data = { ...req.body, password: hashed };

      const newUser = await UserModel.create(data);
      if (newUser) {
        const { password, ...others } = newUser._doc;
        res
          .status(200)
          .json(successResponse(others, "Register new user successfully"));
      }
    } catch (e) {
      res.status(500).json(errorResponse(e.message));
    }
  },
  login: async (req, res) => {
    try {
      const data = req.body;

      const user = await UserModel.findOne({ email: data.email });
      if (!user)
        return res.status(404).json(errorResponse("Wrong email address"));

      const isValidPassword = await bcrypt.compare(
        data.password,
        user.password
      );

      if (!isValidPassword) {
        return res.status(404).json(errorResponse("Wrong password"));
      }

      const accessToken = authController.getAccessToken(data);
      const refreshToken = authController.getRefreshAccessToken(data);
      refreshTokens.push(refreshToken);

      res.setHeader("Set-Cookie", [
        `refreshToken=${refreshToken}; Secure; HttpOnly; SameSite=None; Path=/; Max-Age=2592000; `,
      ]);

      return res.status(200).json(
        successResponse(
          {
            accessToken,
            refreshToken,
          },
          "Login successfully"
        )
      );
    } catch (e) {
      return res.status(500).json(errorResponse(e.message));
    }
  },
  logout: async (req, res) => {
    const refreshTokenStr = req.headers.token;
    const index = refreshTokens.findIndex((token) => token === refreshTokenStr);
    refreshTokens.splice(index, 1);

    res.sendStatus(200);
  },
  refreshToken: async (req, res) => {
    const refreshToken = req.headers.cookie;
    const refreshTokenStr = refreshToken?.split("=")?.[1];

    if (!refreshTokenStr)
      return res.status(401).json(errorResponse("You are not authenticated"));
    // if (!refreshTokens.includes(refreshTokenStr))
    //   return res.status(403).json(errorResponse("Token is not valid"));

    jwt.verify(
      refreshTokenStr,
      process.env.REFRESH_ACCESS_TOKEN_SECRET,
      (err, data) => {
        if (err)
          return res.status(403).json(errorResponse("Token is not valid"));

        const { iat, ...user } = data;
        const newAccessToken = authController.getAccessToken(user);
        const newRefreshToken = authController.getRefreshAccessToken(user);
        const index = refreshTokens.findIndex(
          (token) => token === refreshTokenStr
        );
        refreshTokens.splice(index, 1, newRefreshToken);
        res.setHeader("Set-Cookie", [
          `refreshToken=${newRefreshToken}; Secure; HttpOnly; SameSite=None; Path=/; Max-Age=2592000; `,
        ]);
        return res
          .status(200)
          .json(
            successResponse(
              { accessToken: newAccessToken, refreshToken: newRefreshToken },
              "Refresh token successfully"
            )
          );
      }
    );
  },
  getAccessToken: (data) => {
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3h",
    });
  },
  getRefreshAccessToken: (data) => {
    const refreshToken = jwt.sign(
      data,
      process.env.REFRESH_ACCESS_TOKEN_SECRET
    );
    return refreshToken;
  },
};

export default authController;
