import { Router } from "express";
import {
  getMedicines,
  getMedicineMetadata,
  getMedicineById,
} from "../controllers/Medicine.controllers.js";

const router = Router();

router.route("/").get(getMedicines);
router.route("/meta").get(getMedicineMetadata);
router.route("/:id").get(getMedicineById);

export default router;
