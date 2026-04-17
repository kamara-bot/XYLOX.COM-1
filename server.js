const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Xylox_store:Buttuura@cluster0.bayp373.mongodb.net/?appName=cluster0';

app.use(express.json());
app.use(express.static(path.resolve(__dirname)));

let db;
let usersCollection;
let depositsCollection;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

async function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.post('/api/register', async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const existingUser = await usersCollection.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ error: 'This username is already taken.' });
  }

  const newUser = {
    name,
    username,
    passwordHash: hashPassword(password),
    role: 'user',
    approved: false,
    balance: 0,
    createdAt: new Date()
  };
  const result = await usersCollection.insertOne(newUser);
  res.json({ success: true, userId: result.insertedId, message: 'Registration complete. Wait for admin approval.' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await usersCollection.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  res.json({
    user: sanitizeUser(user),
    message: user.role === 'admin' ? 'Admin login successful.' : user.approved ? 'Login successful.' : 'Account pending approval.'
  });
});

app.get('/api/account/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  const user = await usersCollection.findOne({ _id: new ObjectId(id) });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const deposits = await depositsCollection.find({ userId: new ObjectId(id) }).sort({ createdAt: -1 }).toArray();
  res.json({ user: sanitizeUser(user), deposits });
});

app.post('/api/deposits', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid userId and amount are required.' });
  }

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const request = {
    userId: new ObjectId(userId),
    amount: Number(amount),
    status: 'pending',
    createdAt: new Date()
  };
  await depositsCollection.insertOne(request);
  res.json({ success: true, message: 'Deposit request created and awaiting approval.' });
});

app.get('/api/deposits/user/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  const requests = await depositsCollection.find({ userId: new ObjectId(id) }).sort({ createdAt: -1 }).toArray();
  res.json({ deposits: requests });
});

app.get('/api/admin/pending-users', requireAdmin, async (req, res) => {
  const pendingUsers = await usersCollection.find({ approved: false, role: 'user' }).sort({ createdAt: 1 }).toArray();
  res.json({ users: pendingUsers.map(sanitizeUser) });
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { approved: true } });
  if (result.modifiedCount === 0) {
    return res.status(404).json({ error: 'User not found or already approved.' });
  }
  res.json({ success: true, message: 'User approved.' });
});

app.get('/api/admin/pending-deposits', requireAdmin, async (req, res) => {
  const pendingDeposits = await depositsCollection.aggregate([
    { $match: { status: 'pending' } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $project: { amount: 1, status: 1, createdAt: 1, user: { _id: 1, name: 1, username: 1 } } }
  ]).toArray();
  res.json({ deposits: pendingDeposits });
});

app.post('/api/admin/deposits/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid deposit id.' });
  }

  const deposit = await depositsCollection.findOne({ _id: new ObjectId(id), status: 'pending' });
  if (!deposit) {
    return res.status(404).json({ error: 'Deposit not found or already approved.' });
  }

  await depositsCollection.updateOne({ _id: deposit._id }, { $set: { status: 'approved' } });
  await usersCollection.updateOne({ _id: deposit.userId }, { $inc: { balance: deposit.amount } });
  res.json({ success: true, message: 'Deposit approved and balance updated.' });
});

async function ensureAdminUser() {
  const adminUsername = 'admin@xylox.com';
  const adminPassword = 'Admin123';
  const existing = await usersCollection.findOne({ username: adminUsername });
  if (!existing) {
    await usersCollection.insertOne({
      name: 'XYLOX Admin',
      username: adminUsername,
      passwordHash: hashPassword(adminPassword),
      role: 'admin',
      approved: true,
      balance: 0,
      createdAt: new Date()
    });
    console.log('Default admin created:', adminUsername, 'Password: Admin123');
  }
}

async function start() {
  await MongoClient.connect(MONGODB_URI).then(clientInstance => {
    db = clientInstance.db('xyloxapp');
    usersCollection = db.collection('users');
    depositsCollection = db.collection('deposits');
  });

  await ensureAdminUser();

  app.listen(PORT, () => {
    console.log(`XYLOX backend listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
