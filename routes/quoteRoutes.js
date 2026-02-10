
//I did not know how to edit the existing code to fit the newQuote collection, so I asked Claude for assistance, the code is below the first commented out code I was working on. I have left the original code in place.
// 


/*import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/conn.js";

const router = express.Router();


//GET
router.get("/agg", async (_req, res) => {//Add at the end of http://localhost:3000/api/db/agg
  let collection = db.collection("quotes");

  let result = await collection
    .aggregate([
      {
        $project: {
          _id: 0,
          author_id: 1,
          category_id: 1,
          avg: {
            $avg: "$scores.score",
          },
        },
      },
    ])
    .toArray();

  console.log(result);

  res.json(result);
});

router.get("/learner/:id/avg", async (req, res) => {
  let collection = db.collection("grades");

  let results = await collection
    .aggregate([
      {
        $match: {
          learner_id: Number(req.params.id),
        },
      },
      {
        $unwind: {
          path: "$scores",
        },
      },
      {
        $group: {
          _id: "$class_id",
          quiz: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$scores.type", "quiz"],
                },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          exam: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$scores.type", "exam"],
                },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          homework: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$scores.type", "homework"],
                },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          class_id: "$_id",
          avg: {
            $sum: [
              {
                $multiply: [
                  {
                    $avg: "$exam",
                  },
                  0.5,
                ],
              },
              {
                $multiply: [
                  {
                    $avg: "$quiz",
                  },
                  0.3,
                ],
              },
              {
                $multiply: [
                  {
                    $avg: "$homework",
                  },
                  0.2,
                ],
              },
            ],
          },
        },
      },
    ])
    .toArray();

  res.json(results);
});

// Create new entries (POST)
router.post("/", async (req, res) => {
  let newDoc = req.body;

  if (newDoc.student_id) {
    newDoc.learner_id = newDoc.student_id;
    delete newDoc.student_id;
  }

  //Specify Collection
  let collection = db.collection("grades");

  // Specify Action
  let results = await collection.insertOne(newDoc);
  console.log(results);

  // Return Results
  res.status(204).json(results);
});

// GET by learner_id and class_id
router.get("/class/:classId/learner/:learnerId", async (req, res) => {
  let query = {
    $and: [
      { learner_id: Number(req.params.learnerId) },
      { class_id: Number(req.params.classId) },
    ],
  };

  let collection = db.collection("grades");
  let result = await collection.find(query).toArray();

  if (!result.length) res.status(404).json({ error: "Not Found" });
  else res.json(result);
});

// Add a score to a grade entry (PATCH)
router.patch("/:id/add", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: new ObjectId(req.params.id) };

  let result = await collection.updateOne(query, {
    $push: { scores: req.body },
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Remove a score from a grade entry
router.patch("/:id/remove", async (req, res) => {
  let query = { _id: new ObjectId(req.params.id) };

  let update = {
    $pull: {
      scores: {
        type: req.body.type,
        score: req.body.score,
      },
    },
  };

  // choose collection
  let collection = db.collection("grades");

  // perform action
  let result = await collection.updateOne(query, update);

  // return results
  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

//GET grades by _id
router.get("/:id", async (req, res) => {
  let query = { _id: new ObjectId(req.params.id) };

  // Specify Collection
  let collection = db.collection("grades");

  // Specify Action only return null or the object
  let result = await collection.findOne(query);

  // Return the Results!!
  if (!result) res.status(404).json({ error: "Not Found" });
  else res.json(result);
});

// Get route for backwards compatibility
router.get("/student/:id", async (req, res) => {
  res.redirect(`learner/${req.params.id}`);
});

// Get by student_ID
router.get("/learner/:id", async (req, res) => {
  let query = { learner_id: Number(req.params.id) };
  //Specify Collection
  let collection = db.collection("grades");

  // Specify Action
  let results = await collection.find(query).toArray();

  // Return the results
  if (!results.length) res.status(404).json({ error: "Not Found" });
  else res.json(results);
});

// Delete a learner's grade data
router.delete("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };

  let result = await collection.deleteOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get by class
router.get("/class/:id", async (req, res) => {
  let query = { class_id: Number(req.params.id) };
  //Specify Collection
  let collection = db.collection("grades");

  // Specify Action
  let results = await collection.find(query).toArray();

  // Return the results
  if (!results.length) res.status(404).json({ error: "Not Found" });
  else res.json(results);
});

// Update a class id
router.patch("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.updateMany(query, {
    $set: { class_id: req.body.class_id },
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a class
router.delete("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

export default router;*/





import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/conn.js";

const router = express.Router();

// GET all quotes
router.get("/", async (_req, res) => {
  let collection = db.collection("quotes");
  let result = await collection.find({}).toArray();
  res.json(result);
});

// GET random quote
router.get("/random", async (_req, res) => {
  let collection = db.collection("quotes");
  
  let result = await collection
    .aggregate([
      { $sample: { size: 1 } }
    ])
    .toArray();
  
  res.json(result[0]);
});

// GET quotes by author
router.get("/author/:author", async (req, res) => {
  let collection = db.collection("quotes");
  
  let result = await collection
    .find({ author: req.params.author })
    .toArray();
  
  res.json(result);
});

// GET quotes grouped by author with count
router.get("/agg/by-author", async (_req, res) => {
  let collection = db.collection("quotes");

  let result = await collection
    .aggregate([
      {
        $group: {
          _id: "$author",
          count: { $sum: 1 },
          quotes: { $push: "$text" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    .toArray();

  res.json(result);
});

// GET search quotes by text
router.get("/search/:searchTerm", async (req, res) => {
  let collection = db.collection("quotes");
  
  let result = await collection
    .find({
      text: { $regex: req.params.searchTerm, $options: "i" }
    })
    .toArray();
  
  res.json(result);
});

// Create new quote (POST)
router.post("/", async (req, res) => {
  let newQuote = {
    text: req.body.text,
    author: req.body.author
  };

  let collection = db.collection("quotes");
  let result = await collection.insertOne(newQuote);
  
  res.status(201).json(result);
});

// Update quote by ID (PATCH)
router.patch("/:id", async (req, res) => {
  let collection = db.collection("quotes");
  
  let update = {
    $set: {}
  };
  
  if (req.body.text) update.$set.text = req.body.text;
  if (req.body.author) update.$set.author = req.body.author;
  
  let result = await collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    update
  );
  
  res.json(result);
});

// Delete quote by ID (DELETE)
router.delete("/:id", async (req, res) => {
  let collection = db.collection("quotes");
  
  let result = await collection.deleteOne(
    { _id: new ObjectId(req.params.id) }
  );
  
  res.json(result);
});

export default router;

/*
Key changes made:
- **Removed grade-specific logic** (learner_id, class_id, scores)
- **Simplified aggregation** for quotes grouped by author
- **Added `/random` endpoint** using `$sample` aggregation to get a random quote
- **Added `/author/:author` endpoint** to filter quotes by author
- **Added `/search/:searchTerm` endpoint** for text search
- **Simplified POST/PATCH/DELETE** operations for the simpler quote schema
- **Changed status code** for POST from 204 to 201 (Created)

This gives you a complete CRUD API for your inspirational quotes!*/


