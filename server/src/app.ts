import express from "express";
import "express-async-errors";
import { usersRouter } from "./routes/users/index.js";
import { authRouter } from "./routes/auth/index.js";
import { expressErrorHandler, NotFoundError } from "@mssd/errors";
import { docsMiddleware } from "./openapi/index.js";
import "./config/config";
import { AuthToken } from "./models/session/auth-token.js";
import cookieParser from "cookie-parser";
AuthToken.getInstance(); // initializing the JWK set
const app = express();
import { verifySessionToken } from "./middleware/auth/stateful-auth.js";
import { authMiddlewareSetup } from "./middleware/auth/auth-setup.js";

app.use(cookieParser());
app.use(express.json());
app.use(authMiddlewareSetup());
app.use("/api/accounts/docs", docsMiddleware()); // only in development env
app.use("/api/accounts/auth", authRouter);
app.use("/api/accounts/users", verifySessionToken({ denyAccess: true }), usersRouter);

app.use((req, res, next) => {
    throw new NotFoundError("route");
});

app.use(expressErrorHandler);
export { app };
