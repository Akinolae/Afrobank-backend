const  express = require("express");
const cors = require("cors");
const otpGenerator = require('otp-generator');
const otp = otpGenerator.generate(6, {alphabets: false, digits: true, specialChars: false, upperCase:false})
console.log(otp, 'otp')

const app = express();
app.use(cors());
app.use(express.json());
app.use("/Api/v1", require("./routes/index"));

app.use((req, res) => {
  res.status(400).json({
    success: "error",
    message: "page not found"
  })
})
app.listen(process.env.PORT || 4000, () => console.log(`app is running`));