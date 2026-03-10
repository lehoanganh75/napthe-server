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

/* kết nối MySQL */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

/* tạo sign */
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

    console.log("TSR callback FULL:", JSON.stringify(req.body));

    const status = req.body.status;
    const value = req.body.value;
    const request_id = req.body.request_id;

    try {

        if (status == 1) {

            await db.query(
                "UPDATE users SET money = money + ? WHERE id = ?",
                [value, request_id]
            );

            console.log("Đã cộng tiền:", value);

        } else {

            console.log("Thẻ thất bại hoặc đang chờ");

        }

    } catch (err) {

        console.log("Database error:", err.message);

    }

    res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
