const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5001;

//middleware
const corsOptions = {
  origin: ["http://localhost:5173"],
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
  },
});

//token verify middlewre
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("tokennnn", token);
  if (!token) {
    return res.status(401).send({ message: "not authorzied" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //error
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized" });
    }
    //if token is valid then it would be decoded
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

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

//create a database and database collection for all hotel rooms data
const hotelRoomCollection = client.db("hotelBook").collection("hotelRooms");
//create a database collection for room bookings
const roomBookingsCollection = client
  .db("hotelBook")
  .collection("roomBookings");

//jwt auth related api and send cookies to the client
app.post("/jwt", async (req, res) => {
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
      // sameSite: 'none'
    })
    .send({ success: true });
});

//just for checking
//   app.get("/trydata", verifyToken, async (req, res) => {
//     console.log(req.query.email);
//     // console.log('tok took token', req.cookies.token)
//     console.log('user in the valid token', req.user)
//     if(req.query.email !== req.user.email){
//         return res.status(403).send({message: 'forbidden access'})
//     }
//     let query = {};
//     if(req.query?.email){
//         query = {email: req.query.email}
//     }
//     const cursor = hotelRoomCollection.find(query);
//     const result = await cursor.toArray();
//     res.send(result);
//   });

//hotel room related API
//using get method to read the data what i stored in database
app.get("/roomData", async (req, res) => {
  const cursor = hotelRoomCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

//get method for getting specific room id / update specific room data
app.get("/roomData/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await hotelRoomCollection.findOne(query);
  res.send(result);
});

//using put method to update seat availabilty by decrement 1
app.put("/roomdata/:id", async (req, res) => {
  const id = req.params.id;
  const room = await hotelRoomCollection.findOne({ _id: new ObjectId(id) });
  if (room.availability <= 0) {
    // Handle the case where availability is already at zero
    return res.status(400).json({ error: "No available seats" });
  }
  const result = await hotelRoomCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $inc: { availability: -1 },
    }
  );
});

//room bookings related API
//using get method to read room bookings data
app.get("/roomBooks", async (req, res) => {
  const cursor = roomBookingsCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

//using post method to store room bookings info to the database
app.post("/roomBooks", async (req, res) => {
  const roomBookingsData = req.body;
  console.log(roomBookingsData);
  const result = await roomBookingsCollection.insertOne(roomBookingsData);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("hotel booking is running");
});

app.listen(port, () => {
  console.log(`hotel booking Server is running on port ${port}`);
});
