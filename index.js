const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5001;

//middleware
const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

//access post body and convert into json format
app.use(express.json());
app.use(cookieParser());


//mongodb url
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.es62grd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//mongodb connection
const dbConnect = async () => {
    try {
      client.connect();
      console.log("DB Connected Successfully✅");
    } catch (error) {
      console.log(error.name, error.message);
    }
  };
  dbConnect();
  
  const hotelRoomCollection = client.db("hotelBook").collection("hotelRooms");

  //jwt auth related api
  app.post('/jwt', async(req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user, 'secret', {expiresIn: '2h'})
    res.send(token)
  })



  //just for checking
  app.get("/data", async (req, res) => {
    const cursor = hotelRoomCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });


app.get("/", (req, res) => {
  res.send("hotel booking is running");
});

app.listen(port, () => {
  console.log(`hotel booking Server is running on port ${port}`);
});
