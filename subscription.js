const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3005; // Change the port if needed

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017";
const dbName = "youtube"; // Ensure your MongoDB database is named appropriately

// Middleware
app.use(express.json());

let db, playlists, subscriptions;

// Connect to MongoDB and initialize collections
async function initializeDatabase() {
    try {
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        db = client.db(dbName);
        playlists = db.collection("playlists"); // Initialize playlists collection
        subscriptions = db.collection("subscriptions"); // Initialize subscriptions collection

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

// Routes for Subscriptions

// GET: List all subscriptions
app.get('/subscriptions', async (req, res) => {
    try {
        const allSubscriptions = await subscriptions.find().toArray();
        res.status(200).json(allSubscriptions);
    } catch (err) {
        res.status(500).send("Error fetching subscriptions: " + err.message);
    }
});

// GET: Get subscription details by subscriptionId
app.get('/subscriptions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find subscriptions where the user is either a subscriber or a channel
        const userSubscriptions = await subscriptions.find({
            $or: [{ subscriber: userId }, { channel: userId }]
        }).toArray();

        // If no subscriptions are found, return a 404 response
        if (userSubscriptions.length === 0) {
            return res.status(404).json({ message: "No subscriptions found for this user" });
        }

        res.status(200).json(userSubscriptions);
    } catch (err) {
        res.status(500).send("Error fetching subscriptions: " + err.message);
    }
});

// POST: Add a new subscription
app.post('/subscriptions', async (req, res) => {
    try {
        const newSubscription = req.body;
        const result = await subscriptions.insertOne(newSubscription);
        res.status(201).send(`Subscription added with ID: ${result.insertedId}`);
    } catch (err) {
        res.status(500).send("Error adding subscription: " + err.message);
    }
});

app.post('/subscriptions', async (req, res) => {
    try {
        const { subscriber, channel } = req.body;

        // Validate input
        if (!subscriber || !channel) {
            return res.status(400).json({ message: "Both 'subscriber' and 'channel' are required" });
        }

        // Check if the subscription already exists
        const existingSubscription = await subscriptions.findOne({
            subscriber,
            channel
        });

        if (existingSubscription) {
            return res.status(409).json({ message: "Subscription already exists" });
        }

        // Insert the new subscription
        const newSubscription = {
            subscriptionId: `s${Date.now()}`, // Generate a unique subscription ID
            subscriber,
            channel,
            subscribedAt: new Date()
        };

        const result = await subscriptions.insertOne(newSubscription);

        res.status(201).json({
            message: "Subscription created successfully",
            subscription: newSubscription
        });
    } catch (err) {
        res.status(500).send("Error creating subscription: " + err.message);
    }
});




