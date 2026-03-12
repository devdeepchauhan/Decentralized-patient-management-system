const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/ipfs', require('./routes/ipfs'));

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dpms';

const startServer = async () => {
    try {
      // Attempt to connect to local/provided URI first
      await mongoose.connect(MONGO_URI);
      console.log('Connected to Primary MongoDB');
    } catch (err) {
      console.log('Primary MongoDB not found. Spinning up In-Memory DB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      // Set higher timeout for initial download
      process.env.MONGOMS_PREFER_GLOBAL_PATH = '1';
      const mongoServer = await MongoMemoryServer.create({ instance: { startupTimeout: 60000 } });
      MONGO_URI = mongoServer.getUri();
      await mongoose.connect(MONGO_URI);
      console.log(`Connected to In-Memory MongoDB at ${MONGO_URI}`);
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
