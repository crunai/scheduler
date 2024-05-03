import express from "express";
import { clear } from "./clear";
const router = express.Router();

router.delete("/clear", clear);

export default router;
