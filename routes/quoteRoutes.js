
import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/conn.js";

const router = express.Router();


//GET
router.get("/agg", async (req, res) => {//Add at the end of http://localhost:3000/api/db/agg
  let collection = db.collection("grades");

  let result = await collection
    .aggregate([
      {
        $project: {
          _id: 0,
          class_id: 1,
          learner_id: 1,
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

export default router;
