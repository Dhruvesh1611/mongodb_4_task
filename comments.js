const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3003; // Change the port if needed

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017";
const dbName = "youtube"; // Ensure your MongoDB database is named appropriately

// Middleware
app.use(express.json());

let db, comments;

// Connect to MongoDB and initialize collections
async function initializeDatabase() {
    try {
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        db = client.db(dbName);
        comments = db.collection("comments"); // Initialize comments collection

        // Start server after successful DB connection
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit if database connection fails
    }
}

// Initialize Database
initializeDatabase();

// Routes

// GET: List all comments
app.get('/comments', async (req, res) => {
    try {
        const allComments = await comments.find().toArray();
        res.status(200).json(allComments);
    } catch (err) {
        res.status(500).send("Error fetching comments: " + err.message);
    }
});

// GET: Get comment details by commentId
app.get('/comments/:commentId', async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const comment = await comments.findOne({ commentId });

        if (!comment) {
            return res.status(404).send("Comment not found");
        }

        res.status(200).json(comment);
    } catch (err) {
        res.status(500).send("Error fetching comment details: " + err.message);
    }
});

// POST: Add a new comment
app.post('/comments', async (req, res) => {
    try {
        const newComment = req.body;
        const result = await comments.insertOne(newComment);
        res.status(201).send(`Comment added with ID: ${result.insertedId}`);
    } catch (err) {
        res.status(500).send("Error adding comment: " + err.message);
    }
});

// PUT: Update a comment completely
app.put('/comments/:commentId', async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const updatedComment = req.body;
        const result = await comments.replaceOne({ commentId: commentId }, updatedComment);
        res.status(200).send(`${result.modifiedCount} document(s) updated`);
    } catch (err) {
        res.status(500).send("Error updating comment: " + err.message);
    }
});

// PATCH: Partially update a comment
app.patch('/comments/:commentId', async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const updates = req.body;
        const result = await comments.updateOne(
            { commentId: commentId },
            { $set: updates }
        );
        res.status(200).send(`${result.modifiedCount} document(s) updated`);
    } catch (err) {
        res.status(500).send("Error partially updating comment: " + err.message);
    }
});

// PATCH: Increment likes for a comment
app.patch('/comments/:commentId/likes', async (req, res) => {
    try {
        const commentId = req.params.commentId; // Extract commentId from the URL
        const result = await comments.updateOne(
            { commentId: commentId }, // Match the comment by its commentId
            { $inc: { likes: 1 } } // Increment the 'likes' field by 1
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Comment not found");
        }

        res.status(200).send(`${result.modifiedCount} comment(s) updated with incremented likes.`);
    } catch (err) {
        res.status(500).send("Error incrementing likes: " + err.message);
    }
});

// DELETE: Remove a comment
app.delete('/comments/:commentId', async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const result = await comments.deleteOne({ commentId: commentId });
        res.status(200).send(`${result.deletedCount} document(s) deleted`);
    } catch (err) {
        res.status(500).send("Error deleting comment: " + err.message);
    }
});
