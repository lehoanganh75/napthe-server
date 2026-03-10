require("dotenv").config();

const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const qs = require("qs");

const app = express();
app.use(express.json());

const partner_id = "6459037486";
const partner_key = process.env.PARTNER_KEY;

function createSign(code, serial) {
    return crypto
        .createHash("md5")
        .update(partner_key + code + serial)
        .digest("hex");
}

app.get("/", (req,res)=>{
    res.send("Nap the server running");
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
            data
        );

        res.json(result.data);

    } catch (err) {
        res.status(500).json(err.message);
    }

});

/* callback */
app.post("/callback", async (req, res) => {

    console.log("TSR callback:", req.body);

    try {

        await axios.post(
            "http://luongcuongshop.rf.gd/api/callback.php",
            qs.stringify(req.body)
        );

    } catch(err){
        console.log("Update error:", err.message);
    }

    res.send("OK");

});

app.listen(3000);