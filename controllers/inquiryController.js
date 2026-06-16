const Inquiry = require("../models/Inquiry");
const User = require("../models/User");

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

// Get Today's Follow-ups
exports.getTodayFollowups = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const inquiries = await Inquiry.find({
            followUpDate: {
                $gte: new Date(today + "T00:00:00.000Z"),
                $lte: new Date(today + "T23:59:59.999Z")
            }
        }).sort({ followUpDate: 1 });

        res.json(inquiries);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// 📊 Today Notes Count per User
exports.getTodayUserNoteCount = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const result = await Inquiry.aggregate([
            // flatten notes array
            { $unwind: "$notes" },

            // filter today's notes only
            {
                $match: {
                    "notes.createdAt": {
                        $gte: todayStart,
                        $lte: todayEnd
                    }
                }
            },

            // group by addedBy (user)
            {
                $group: {
                    _id: "$notes.addedBy",
                    totalNotesToday: { $sum: 1 }
                }
            },

            // join user data
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },

            { $unwind: "$user" },

            // final format
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    name: "$user.name",
                    email: "$user.email",
                    role: "$user.role",
                    totalNotesToday: 1
                }
            },

            // sort highest first
            {
                $sort: { totalNotesToday: -1 }
            }
        ]);

        res.json(result);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// 👤 Today Follow-ups grouped by User
exports.getTodayFollowupsByUser = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const result = await Inquiry.aggregate([
            // 📅 filter only today's followups
            {
                $match: {
                    followUpDate: {
                        $gte: todayStart,
                        $lte: todayEnd
                    }
                }
            },

            // 👤 group by user who added notes
            {
                $unwind: "$notes"
            },

            {
                $match: {
                    "notes.createdAt": {
                        $gte: todayStart,
                        $lte: todayEnd
                    }
                }
            },

            {
                $group: {
                    _id: "$notes.addedBy",
                    inquiries: {
                        $push: {
                            inquiryId: "$_id",
                            name: "$name",
                            mobileNumber: "$mobileNumber",
                            schoolCollege: "$schoolCollege",
                            followUpDate: "$followUpDate",
                            status: "$status",
                            lastNote: "$notes.note",
                            noteDate: "$notes.createdAt"
                        }
                    }
                }
            },

            // 👤 user details join
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },

            {
                $unwind: "$user"
            },

            // 🎯 final format
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    name: "$user.name",
                    email: "$user.email",
                    role: "$user.role",
                    totalFollowups: { $size: "$inquiries" },
                    inquiries: 1
                }
            },

            {
                $sort: { totalFollowups: -1 }
            }
        ]);

        res.json(result);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// get today notes by user
exports.getTodayNotesByUser = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const users = await User.find({}, "name email role");

    const result = await Promise.all(
      users.map(async (user) => {

        const inquiries = await Inquiry.find({
          notes: {
            $elemMatch: {
              addedBy: user._id,
              createdAt: {
                $gte: start,
                $lte: end
              }
            }
          }
        });

        const notesList = [];

        inquiries.forEach((inq) => {

          const todayNotes = inq.notes.filter(
            (note) =>
              note.addedBy?.toString() === user._id.toString() &&
              note.createdAt >= start &&
              note.createdAt <= end
          );

          todayNotes.forEach((note) => {
            notesList.push({
              inquiryId: inq._id,
              inquiryName: inq.name,
              mobileNumber: inq.mobileNumber,
              schoolCollege: inq.schoolCollege,
              note: note.note,
              createdAt: note.createdAt
            });
          });
        });

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalNotesToday: notesList.length,
          notes: notesList
        };
      })
    );

    res.json(result);

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