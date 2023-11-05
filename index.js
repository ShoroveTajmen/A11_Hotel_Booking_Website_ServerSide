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
  }
});


//token verify middlewre
const verifyToken = async(req, res, next) => {
    const  token = req.cookies?.token;
    console.log('tokennnn', token)
    if(!token){
        return res.status(401).send({message: 'not authorzied'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //error
        if(err){
            console.log(err)
            return res.status(401).send({message: 'unauthorized'})
        }
        //if token is valid then it would be decoded
        console.log('value in the token', decoded)
        req.user = decoded;
        next()
    })
    
}




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

  //jwt auth related api and send cookies to the client
  app.post('/jwt', async(req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'})
    res
    .cookie('token', token, {
        httpOnly: true,
        secure: false,
        // sameSite: 'none'
    })
    .send({success: true})
  })



  //just for checking
  app.get("/trydata", verifyToken, async (req, res) => {
    // console.log('tok took token', req.cookies.token)
    console.log('user in the valid token', req.user)
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
