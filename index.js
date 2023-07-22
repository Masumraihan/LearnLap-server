const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken")
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req,res,next) => {
  const {authorization} = req.headers;
  if (!authorization) {
    return res.status(401).send({error:true,message:"unauthorized access"})
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({error:true, message:"unauthorized access"})
  }
  jwt.verify(token,process.env.TOKEN_SECRET,(err,decode) => {
    if (err) {
      return res.status(401).send({error:true,message:"unauthorized access"})
    }
    req.decode === decode
    next()
  })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dgzmwwl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const toyCollection = client.db("toysCollection").collection("toys");
    const reviewsCollection = client.db("toysCollection").collection("reviews");
    const caresCollection = client
      .db("toysCollection")
      .collection("customerCares");

      // sign JWT
      app.post("/jwt", async(req,res) => {
        const email = req.body;
        const token = jwt.sign(email,process.env.TOKEN_SECRET,{expiresIn:"1h"});
        res.send(token)
      })

    app.get("/toys", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/gallery", async (req, res) => {
      const result = await toyCollection
        .find()
        .toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.get("/cares", async (req, res) => {
      const result = await caresCollection.find().toArray();
      res.send(result);
    });

    app.get("/allToys", async (req, res) => {
      let query = {};
      if (req.query?.searchText) {
        query = { toyName: { $regex: req.query?.searchText, $options: "i" } };
      }

      const result = await toyCollection
        .find(query)
        .limit(20)
        .project({
          toyName: 1,
          category: 1,
          price: 1,
          quantity: 1,
          sellerName: 1,
        })
        .toArray();
      res.send(result);
    });

    app.get("/toyDetails/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    app.get("/myToys",verifyJWT, async (req, res) => {
      let sortBy = 1;
      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
      }
      if (req.query?.sortBy) {
        sortBy = { price: req.query?.sortBy };
      }
      const result = await toyCollection.find(query).sort(sortBy).toArray();
      res.send(result);
    });

    app.post("/addToy", async (req, res) => {
      const toyInfo = req.body;
      const result = await toyCollection.insertOne(toyInfo);
      res.send(result);
    });

    app.patch("/toys/:id", async (req, res) => {
      const { id } = req.params;
      const toyInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedInfo = {
        $set: {
          price: toyInfo.price,
          quantity: toyInfo.quantity,
          description: toyInfo.description,
        },
      };
      const result = await toyCollection.updateOne(filter, updatedInfo);
      res.send(result);
    });

    app.delete("/toys/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`learn lab server is running port: ${port}`);
});
