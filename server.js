const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const partner_id = "6459037486";
const partner_key = "c1203cb781e216a57119cf6a8c1f805d";

function createSign(code, serial) {
    return crypto
        .createHash("md5")
        .update(partner_key + code + serial)
        .digest("hex");
}

/* gửi thẻ lên TSR */
app.post("/napthe", async (req, res) => {

    const sign = createSign(req.body.code, req.body.serial);

    const data = {
        telco: req.body.telco,
        code: req.body.code,
        serial: req.body.serial,
        amount: req.body.amount,
        request_id: Date.now() + Math.floor(Math.random()*1000),
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
            "http://luongcuongshop.rf.gd/api/update.php",
            req.body
        );

    } catch(err){
        console.log("Update error:", err.message);
    }

    res.send("ok");

});

app.listen(3000);