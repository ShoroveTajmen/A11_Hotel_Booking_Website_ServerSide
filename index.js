const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5001;

//middleware
app.use(
    cors({
      origin: ["http://localhost:5173", "http://wealthy-minute.surge.sh"],
      credentials: true,
    })
  );
// app.use(cors(corsOptions));

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
  console.log("token in the middleware", token);
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
//create a database collection for room review
const roomReviewCollection = client.db("hotelBook").collection("roomReview");



//JWT auth related api and send cookies to the client
app.post("/jwt", async (req, res) => {
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

}).send({success: true})
});
//for user log out
app.post("/logout", async (req, res) => {
  {
    const user = req.body;
    console.log("loging out", user);
    res.clearCookie("token", { maxAge: 0 }).send({ success: true });
  }
});



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
  const result = await hotelRoomCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $inc: { availability: -1 },
    }
  );
  res.send(result);
});




//room bookings related API
//using get method to read room bookings data
// app.get("/roomBooks", async (req, res) => {
//   const cursor = roomBookingsCollection.find();
//   const result = await cursor.toArray();
//   res.send(result);
// });
app.get("/roomBooks", verifyToken, async (req, res) => {
    console.log(req.query.email);
    // console.log('tokeeennnnnnnnn', req.cookies)
    console.log('token owner info', req.user)
    if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'Forbidden access'})
    }
    const cursor = roomBookingsCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });


//get specific roomBooks data
app.get("/roomBooks/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await roomBookingsCollection.findOne(query);
  res.send(result);
});

//using post method to store room bookings info to the database
app.post("/roomBooks", async (req, res) => {
  const roomBookingsData = req.body;
  console.log(roomBookingsData);
  const result = await roomBookingsCollection.insertOne(roomBookingsData);
  res.send(result);
});

//using put method to update room booking date
app.put("/roomBooks/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedDate = req.body;
  const date = {
    $set: {
      selectedDate: updatedDate.selectedDate,
    },
  };
  const result = await roomBookingsCollection.updateOne(filter, date, options);
  res.send(result);
});

//using delete method to delete specific room booking from database
app.delete("/roomBooks/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await roomBookingsCollection.deleteOne(query);
  res.send(result);
});


//Room review related API
//using get method to read the roomReview what i stored in database
app.get("/roomReview", async (req, res) => {
  const cursor = roomReviewCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});
//get method for getting specific rooms review
app.get("/roomReview/:id", async (req, res) => {
  const id = req.params.id;
  const query = { roomId: id };
  const result = await roomReviewCollection.find(query).toArray();
  res.send(result);
});

//using post method to store roomReview data in the database
app.post("/roomReview", async (req, res) => {
  const review = req.body;
  console.log(review);
  const result = await roomReviewCollection.insertOne(review);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("hotel booking is running");
});

app.listen(port, () => {
  console.log(`hotel booking Server is running on port ${port}`);
});
