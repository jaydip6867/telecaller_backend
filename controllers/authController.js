const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "telecaller"
        });

        res.json(user);

    } catch (err) {
        res.status(500).json(err);
    }
};

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            token
        });

    } catch (err) {
        res.status(500).json(err);
    }
};