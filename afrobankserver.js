const  express = require("express");
const cors = require("cors");
const {sequelize} = require("./config/database/dbconnect");
sequelize.authenticate().then(()=> {
  console.log("connected successfully")
}).catch((err) => {
  console.log("Unable to connect to db", err)
})
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
app.listen(process.env.NODE_ENV || 4000, () => console.log(`app is running`));