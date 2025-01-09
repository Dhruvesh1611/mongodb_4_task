const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3002;

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017";
const dbName = "youtube"; // Ensure your MongoDB database is named appropriately

// Middleware
app.use(express.json());

let db, videos;

// Connect to MongoDB and initialize collections
async function initializeDatabase() {
    try {
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        db = client.db(dbName);
        videos = db.collection("videos"); // Initialize videos collection

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

// GET: List all videos
app.get('/videos', async (req, res) => {
    try {
        const allVideos = await videos.find().toArray();
        res.status(200).json(allVideos);
    } catch (err) {
        res.status(500).send("Error fetching videos: " + err.message);
    }
});

// GET: Get video details by videoId
app.get('/videos/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const video = await videos.findOne({ videoId });

        if (!video) {
            return res.status(404).send("Video not found");
        }

        res.status(200).json(video);
    } catch (err) {
        res.status(500).send("Error fetching video details: " + err.message);
    }
});

// POST: Add a new video
app.post('/videos', async (req, res) => {
    try {
        const newVideo = req.body;
        const result = await videos.insertOne(newVideo);
        res.status(201).send(`Video added with ID: ${result.insertedId}`);
    } catch (err) {
        res.status(500).send("Error adding video: " + err.message);
    }
});

// PUT: Update a video completely
app.put('/videos/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const updatedVideo = req.body;
        const result = await videos.replaceOne({ videoId: videoId }, updatedVideo);
        res.status(200).send(`${result.modifiedCount} document(s) updated`);
    } catch (err) {
        res.status(500).send("Error updating video: " + err.message);
    }
});

// PATCH: Partially update a video
app.patch('/videos/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const updates = req.body;
        const result = await videos.updateOne(
            { videoId: videoId },
            { $set: updates }
        );
        res.status(200).send(`${result.modifiedCount} document(s) updated`);
    } catch (err) {
        res.status(500).send("Error partially updating video: " + err.message);
    }
});

// PATCH: Increment likes for a video
app.patch('/videos/:videoId/likes', async (req, res) => {
    try {
        const videoId = req.params.videoId; // Extract videoId from the URL
        const result = await videos.updateOne(
            { videoId: videoId }, // Match the video by its videoId
            { $inc: { likes: 1 } } // Increment the 'likes' field by 1
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Video not found");
        }

        res.status(200).send(`${result.modifiedCount} video(s) updated with incremented likes.`);
    } catch (err) {
        res.status(500).send("Error incrementing likes: " + err.message);
    }
});


// DELETE: Remove a video
app.delete('/videos/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const result = await videos.deleteOne({ videoId: videoId });
        res.status(200).send(`${result.deletedCount} document(s) deleted`);
    } catch (err) {
        res.status(500).send("Error deleting video: " + err.message);
    }
});
