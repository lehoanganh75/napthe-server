require("dotenv").config();

const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const qs = require("qs");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const partner_id = "6459037486";
const partner_key = process.env.PARTNER_KEY;

<<<<<<< HEAD
/* kết nối MySQL */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

/* tạo sign */
=======
/* tạo sign TSR */
>>>>>>> 566e8076729a1e6a0b2d76009fd9b190816317bd
function createSign(code, serial) {
    return crypto
        .createHash("md5")
        .update(partner_key + code + serial)
        .digest("hex");
}

/* test server */
app.get("/", (req, res) => {
    res.send("Nap the server running");
});

/* lấy IP server */
app.get("/ip", async (req, res) => {
    try {
        const r = await axios.get("https://api.ipify.org?format=json");
        res.json(r.data);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/* test callback */
app.get("/callback", (req, res) => {
    res.send("Callback endpoint working");
});

/* gửi thẻ lên TSR */
app.post("/napthe", async (req, res) => {

    const sign = createSign(req.body.code, req.body.serial);

    const data = {
        telco: req.body.telco,
        code: req.body.code,
        serial: req.body.serial,
        amount: req.body.amount,
        request_id: req.body.request_id,
        partner_id: partner_id,
        sign: sign
    };

    try {

        const result = await axios.post(
            "https://thesieure.com/chargingws/v2",
            qs.stringify(data),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        res.json(result.data);

    } catch (err) {

        console.log("TSR error:", err.message);
        res.status(500).json(err.message);

    }

});

/* nhận callback từ TSR */
app.post("/callback", async (req, res) => {

    console.log("TSR callback:", req.body);

    const { status, value, request_id } = req.body;

    try {

<<<<<<< HEAD
        if (status == 1) {

            /* ví dụ request_id = user_id */
            await db.query(
                "UPDATE users SET money = money + ? WHERE id = ?",
                [value, request_id]
            );

            console.log("Đã cộng tiền:", value);

        } else {

            console.log("Thẻ lỗi");

        }
=======
        const r = await axios.post(
            "https://shopluongcuong.rf.gd/api/callback.php",
            qs.stringify(req.body),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );
>>>>>>> 566e8076729a1e6a0b2d76009fd9b190816317bd

        console.log("Website response:", r.data);

    } catch (err) {

<<<<<<< HEAD
        console.log("Database error:", err.message);
=======
        console.log("Update error:", err.response?.status);
        console.log("Update error data:", err.response?.data);
>>>>>>> 566e8076729a1e6a0b2d76009fd9b190816317bd

    }

    res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
