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

    console.log("TSR callback:", req.body);

    const statusCode = parseInt(req.body.status);
    const request_id = req.body.request_id;
    const value = parseInt(req.body.value);

    try {

        const [rows] = await db.query(
            "SELECT * FROM cards WHERE code=?",
            [request_id]
        );

        if(rows.length === 0){
            console.log("Không tìm thấy giao dịch");
            return res.send("OK");
        }

        const card = rows[0];

        if(card.status !== "xuly"){
            console.log("Giao dịch đã xử lý trước đó");
            return res.send("OK");
        }

        const username = card.username;

        if(statusCode === 1){

            await db.query(
                "UPDATE cards SET status='thanhcong', thucnhan=? WHERE id=?",
                [value, card.id]
            );

            await db.query(
                "UPDATE users SET money = money + ?, total_money = total_money + ? WHERE username=?",
                [value, value, username]
            );

            console.log("Cộng tiền thành công:", value);

        }
        else if(statusCode === 2){

            await db.query(
                "UPDATE cards SET status='saimenhgia' WHERE id=?",
                [card.id]
            );

            console.log("Sai mệnh giá");

        }
        else{

            await db.query(
                "UPDATE cards SET status='thatbai' WHERE id=?",
                [card.id]
            );

            console.log("Thẻ thất bại");

        }

    } catch(err){

        console.log("Database error:", err.message);

    }

    res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
