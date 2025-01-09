const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3004; // Change the port if needed

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017";
const dbName = "youtube"; // Ensure your MongoDB database is named appropriately

// Middleware
app.use(express.json());

let db, playlists;

// Connect to MongoDB and initialize collections
async function initializeDatabase() {
    try {
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        db = client.db(dbName);
        playlists = db.collection("playlists"); // Initialize playlists collection

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

// GET: List all playlists
app.get('/playlists', async (req, res) => {
    try {
        const allPlaylists = await playlists.find().toArray();
        res.status(200).json(allPlaylists);
    } catch (err) {
        res.status(500).send("Error fetching playlists: " + err.message);
    }
});

// GET: Get playlist details by playlistId
app.get('/playlists/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch playlists for the given userId
        const userPlaylists = await playlists.find({ userId }).toArray();

        // If no playlists are found, return a 404 response
        if (userPlaylists.length === 0) {
            return res.status(404).json({ message: "No playlists found for this user" });
        }

        // Return the user's playlists
        res.status(200).json(userPlaylists);
    } catch (err) {
        res.status(500).send("Error fetching playlists: " + err.message);
    }
});

// POST: Add a new playlist
app.post('/playlists', async (req, res) => {
    try {
        const newPlaylist = req.body;
        const result = await playlists.insertOne(newPlaylist);
        res.status(201).send(`Playlist added with ID: ${result.insertedId}`);
    } catch (err) {
        res.status(500).send("Error adding playlist: " + err.message);
    }
});

// PUT: Update a playlist completely
app.put('/playlists/:playlistId', async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const updatedPlaylist = req.body;
        const result = await playlists.replaceOne({ playlistId: playlistId }, updatedPlaylist);
        res.status(200).send(`${result.modifiedCount} document(s) updated`);
    } catch (err) {
        res.status(500).send("Error updating playlist: " + err.message);
    }
});

// PUT: Update a playlist completely and push a video
app.put('/playlists/:playlistId/videos', async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const { videoId, updates } = req.body;

        // Check if playlist exists
        const playlist = await playlists.findOne({ playlistId });
        if (!playlist) {
            return res.status(404).send("Playlist not found");
        }

        // Update the playlist and push the new video if provided
        const updatePayload = {
            ...updates, // Any fields to update
        };

        if (videoId) {
            updatePayload.videos = playlist.videos || [];
            if (!updatePayload.videos.includes(videoId)) {
                updatePayload.videos.push(videoId); // Add video to the array if not already present
            }
        }

        const result = await playlists.replaceOne(
            { playlistId },
            { ...playlist, ...updatePayload } // Merge the original playlist with the updates
        );

        res.status(200).send(`${result.modifiedCount} playlist(s) updated and video added.`);
    } catch (err) {
        res.status(500).send("Error updating playlist and adding video: " + err.message);
    }
});


// PATCH: Add video to playlist
app.patch('/playlists/:playlistId/add-video', async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const { videoId } = req.body; // Expect videoId in the body
        const result = await playlists.updateOne(
            { playlistId: playlistId },
            { $addToSet: { videos: videoId } } // Add videoId to the videos array
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Playlist not found");
        }

        res.status(200).send(`${result.modifiedCount} playlist(s) updated with added video.`);
    } catch (err) {
        res.status(500).send("Error adding video to playlist: " + err.message);
    }
});

// DELETE: Remove a playlist
app.delete('/playlists/:playlistId', async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const result = await playlists.deleteOne({ playlistId: playlistId });
        res.status(200).send(`${result.deletedCount} document(s) deleted`);
    } catch (err) {
        res.status(500).send("Error deleting playlist: " + err.message);
    }
});

// PATCH: Remove video from playlist
app.patch('/playlists/:playlistId/remove-video', async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const { videoId } = req.body; // Expect videoId in the body
        const result = await playlists.updateOne(
            { playlistId: playlistId },
            { $pull: { videos: videoId } } // Remove videoId from the videos array
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Playlist not found");
        }

        res.status(200).send(`${result.modifiedCount} playlist(s) updated with removed video.`);
    } catch (err) {
        res.status(500).send("Error removing video from playlist: " + err.message);
    }
});
