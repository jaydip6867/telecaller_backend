const Inquiry = require("../models/Inquiry");
const XLSX = require("xlsx");

// Add Inquiry
exports.createInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.create({
            ...req.body,
            status: req.body.status || "pending"
        });

        res.status(201).json(inquiry);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get All Inquiries
exports.getAllInquiry = async (req, res) => {

    try {

        const inquiry = await Inquiry.find()
            .sort({ createdAt: -1 });

        res.json(inquiry);

    } catch (err) {

        res.status(500).json(err);

    }

};

// Add Followup Note
exports.addNote = async (req, res) => {
  try {
    const { note, status } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found"
      });
    }

    // 📝 add note
    inquiry.notes.push({
      note,
      addedBy: req.user.id
    });

    // 🔥 AUTO STATUS UPDATE LOGIC
    if (status) {
      inquiry.status = status;
    } else {
      // default logic if no status passed
      if (inquiry.status === "pending") {
        inquiry.status = "in_calling";
      }
    }

    await inquiry.save();

    res.json(inquiry);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

// single inquiry get
exports.getSingleInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate("notes.addedBy", "name email");

        if (!inquiry) {
            return res.status(404).json({
                message: "Inquiry not found"
            });
        }

        res.json(inquiry);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// export to Excel
exports.importExcel = async (req, res) => {
    try {
        const XLSX = require("xlsx");
        const Inquiry = require("../models/Inquiry");

        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet);

        const inquiries = data.map(item => {

            // notes string ne array ma convert karo
            let notesArray = [];

            if (item.notes) {
                notesArray = item.notes.split("|").map(n => ({
                    note: n.trim(),
                    addedBy: req.user.id // login user
                }));
            }

            return {
                name: item.name,
                std: item.std,
                mobileNumber: item.mobileNumber,
                schoolCollege: item.schoolCollege,

                status: item.status || "pending",
                notes: notesArray
            };
        });

        await Inquiry.insertMany(inquiries);

        res.json({
            message: "Excel imported successfully",
            count: inquiries.length
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};