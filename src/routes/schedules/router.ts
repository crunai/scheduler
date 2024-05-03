import express from "express";
import { createDaysInWeek } from "./createDaysInWeek";
import { createSelectedDates } from "./createSelectedDates";
import { getCommonAvailabilities } from "./getCommonAvailabilities";
import { info } from "./info";

const router = express.Router();

router.post("/create/days-in-week", createDaysInWeek);
router.post("/create/selected-dates", createSelectedDates);
router.get("/common-availabilities", getCommonAvailabilities);
router.get("/info", info);

export default router;
