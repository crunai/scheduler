import express from "express";
import { login } from "./login";
import { addAvailabilities } from "./addAvailabilities";
import { removeAvailability } from "./removeAvailability";
const router = express.Router();

router.post("/login", login);
router.put("/add-availabilities", addAvailabilities);
router.post("/remove-availabilities", removeAvailability);

export default router;
