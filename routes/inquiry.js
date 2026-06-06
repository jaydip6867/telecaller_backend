const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const upload =
require("../middleware/upload");

const inquiryController =
require("../controllers/inquiryController");

router.post(
  "/",
  auth,
  inquiryController.createInquiry
);

router.get(
  "/",
  auth,
  inquiryController.getAllInquiry
);

router.post(
  "/:id/note",
  auth,
  inquiryController.addNote
);

router.get(
  "/:id",
  auth,
  inquiryController.getSingleInquiry
);

router.post(
  "/import-excel",
  auth,
  upload.single("file"),
  inquiryController.importExcel
);

module.exports = router;