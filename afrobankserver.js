const express = require("express");
const cors = require("cors");
const {response} = require("./controller/responseHandler");
require("./config/database/dbconnect");
const db = require("./config/database/dbconnect");
db.connect();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/Api/v1", require("./routes/index"));

app.use((req, res) => {
  const msg = "page not found";
  response(msg, "error", 400, res);
})
app.listen(process.env.PORT || 4000, () => console.log(`app is running`));