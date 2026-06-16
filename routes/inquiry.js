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

router.get("/today-followups", auth, inquiryController.getTodayFollowups);

router.post(
  "/import-excel",
  auth,
  upload.single("file"),
  inquiryController.importExcel
);

router.get(
  "/today-user-note-count",
  auth,
  inquiryController.getTodayUserNoteCount
);

router.get(
  "/today-followups-by-user",
  auth,
  inquiryController.getTodayFollowupsByUser
);

router.get(
  "/today-notes-by-user",
  auth,
  inquiryController.getTodayNotesByUser
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
  "/:id",
  auth,
  inquiryController.updateInquiry
);



module.exports = router;