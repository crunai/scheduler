import express from "express";
import { health } from "./health";

const router = express.Router();
router.get("/", health);

export default router;
