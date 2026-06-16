const Inquiry = require("../models/Inquiry");

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
// exports.addNote = async (req, res) => {
//     try {
//         const { note, status } = req.body;

//         const inquiry = await Inquiry.findById(req.params.id);

//         if (!inquiry) {
//             return res.status(404).json({
//                 message: "Inquiry not found"
//             });
//         }

//         // 📝 add note
//         inquiry.notes.push({
//             note,
//             addedBy: req.user.id
//         });

//         // 🔥 AUTO STATUS UPDATE LOGIC
//         if (status) {
//             inquiry.status = status;
//         } else {
//             // default logic if no status passed
//             if (inquiry.status === "pending") {
//                 inquiry.status = "in_calling";
//             }
//         }

//         await inquiry.save();

//         res.json(inquiry);

//     } catch (err) {
//         res.status(500).json({
//             message: err.message
//         });
//     }
// };

// Add Followup Note
exports.addNote = async (req, res) => {
    try {
        const { note, status, followUpDate } = req.body;

        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                message: "Inquiry not found"
            });
        }

        // 📝 add note
        if (note) {
            inquiry.notes.push({
                note,
                addedBy: req.user.id
            });
        }

        // 🔥 status update logic
        if (status) {
            inquiry.status = status;
        } else {
            if (inquiry.status === "pending") {
                inquiry.status = "in_calling";
            }
        }

        // 📅 followUpDate update
        if (followUpDate) {
            inquiry.followUpDate = followUpDate;
        }

        await inquiry.save();

        res.json(inquiry);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// Update Inquiry
exports.updateInquiry = async (req, res) => {
    try {

        const {
            name,
            std,
            mobileNumber,
            schoolCollege,
            tution,
            status
        } = req.body;

        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                message: "Inquiry not found"
            });
        }

        inquiry.name = name || inquiry.name;
        inquiry.std = std || inquiry.std;
        inquiry.mobileNumber =
            mobileNumber || inquiry.mobileNumber;
        inquiry.schoolCollege =
            schoolCollege || inquiry.schoolCollege;

        inquiry.tution =
            tution || inquiry.tution;

        inquiry.status =
            status || inquiry.status;

        await inquiry.save();

        res.json({
            message: "Inquiry updated successfully",
            inquiry
        });

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
// exports.importExcel = async (req, res) => {
//     try {
//         const XLSX = require("xlsx");
//         const Inquiry = require("../models/Inquiry");

//         const workbook = XLSX.readFile(req.file.path);
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];

//         const data = XLSX.utils.sheet_to_json(sheet);

//         const inquiries = data.map(item => {

//             // notes string ne array ma convert karo
//             let notesArray = [];

//             if (item.notes) {
//                 notesArray = item.notes.split("|").map(n => ({
//                     note: n.trim(),
//                     addedBy: req.user.id // login user
//                 }));
//             }

//             return {
//                 name: item.name,
//                 std: item.std,
//                 mobileNumber: item.mobileNumber,
//                 schoolCollege: item.schoolCollege,

//                 status: item.status || "pending",
//                 notes: notesArray
//             };
//         });

//         await Inquiry.insertMany(inquiries);

//         res.json({
//             message: "Excel imported successfully",
//             count: inquiries.length
//         });

//     } catch (err) {
//         res.status(500).json({
//             message: err.message
//         });
//     }
// };

exports.importExcel = async (req, res) => {
    try {
        const fs = require("fs");
        const XLSX = require("xlsx");

        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet);

        // 🔥 Normalize function
        const normalizeMobile = (num) => {
            if (!num) return "";
            return String(num)
                .replace(/\D/g, "")   // only digits
                .trim();
        };

        // Step 1: normalize Excel numbers
        const mobileNumbers = data
            .map(item => normalizeMobile(item.mobileNumber))
            .filter(Boolean);

        // Step 2: DB existing numbers also normalize
        const existingInquiries = await Inquiry.find(
            {},
            { mobileNumber: 1 }
        );

        const existingNumbersSet = new Set(
            existingInquiries.map(i => normalizeMobile(i.mobileNumber))
        );

        // Step 3: filter duplicates correctly
        const inquiries = data
            .filter(item => {
                const mobile = normalizeMobile(item.mobileNumber);
                return mobile && !existingNumbersSet.has(mobile);
            })
            .map(item => {
                let notesArray = [];

                if (item.notes) {
                    notesArray = item.notes.split("|").map(n => ({
                        note: n.trim(),
                        addedBy: req.user.id
                    }));
                }

                return {
                    name: item.name,
                    std: item.std,
                    mobileNumber: normalizeMobile(item.mobileNumber),
                    schoolCollege: item.schoolCollege,
                    tution: '',
                    followUpDate: '',
                    status: item.status || "pending",
                    notes: notesArray
                };
            });

        if (inquiries.length > 0) {
            await Inquiry.insertMany(inquiries);
        }

        res.json({
            message: "Excel imported successfully (duplicates skipped)",
            inserted: inquiries.length,
            skipped: data.length - inquiries.length
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    } finally {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};