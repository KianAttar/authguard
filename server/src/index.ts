import mongoose from "mongoose";
import { app } from "./app.js";
import { InternalServerError } from "@mssd/errors";

const startUp = async () => {
    try {
        await mongoose.connect("mongodb://accounts-mongo-srv:27017/accounts");
        console.log("connected to accounts db...");
    } catch (err) {
        throw new InternalServerError("Database connection failed", err as Error);
    }
    app.listen(3000, () => {
        console.log("app listening on 3000...");
    });
};

startUp();
