const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = 3000;

// Priority weight: lower is higher priority
const PRIORITY_MAP = { HIGH: 1, MEDIUM: 2, LOW: 3 };

// In-memory job queue (sorted manually)
const jobQueue = []; // { priority, time, ingestion_id, batch_id, ids }

const ingestions = {}; // ingestion_id -> { status, batches }

let processing = false;

// Helper to update status
function updateIngestionStatus(ingestion_id) {
  const batches = ingestions[ingestion_id].batches;
  const statuses = new Set(batches.map(b => b.status));
  if (statuses.size === 1 && statuses.has('yet_to_start')) {
    ingestions[ingestion_id].status = 'yet_to_start';
  } else if (statuses.size === 1 && statuses.has('completed')) {
    ingestions[ingestion_id].status = 'completed';
  } else {
    ingestions[ingestion_id].status = 'triggered';
  }
}

// Async batch processor
async function processQueue() {
  if (processing) return;
  processing = true;

  while (jobQueue.length > 0) {
    // Sort by priority and created time
    jobQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.time - b.time;
    });

    const job = jobQueue.shift();
    const { ingestion_id, batch_id, ids } = job;

    const batch = ingestions[ingestion_id].batches.find(b => b.batch_id === batch_id);
    if (batch) batch.status = 'triggered';
    updateIngestionStatus(ingestion_id);

    console.log(`Processing batch ${batch_id}:`, ids);
    // Simulate processing: 0.5s per ID + 5s per batch
    await new Promise(res => setTimeout(res, 5000));
    for (const id of ids) {
      await new Promise(res => setTimeout(res, 500)); // Simulate external call
      console.log(`Processed ID ${id}`);
    }

    if (batch) batch.status = 'completed';
    updateIngestionStatus(ingestion_id);
  }

  processing = false;
}

// POST /ingest
app.post('/ingest', (req, res) => {
  const { ids, priority } = req.body;

  if (!ids || !Array.isArray(ids) || !priority || !PRIORITY_MAP[priority]) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const ingestion_id = uuidv4();
  const now = Date.now();
  const batches = [];

  for (let i = 0; i < ids.length; i += 3) {
    const batchIds = ids.slice(i, i + 3);
    const batch_id = uuidv4();

    // Add job to queue
    jobQueue.push({
      priority: PRIORITY_MAP[priority],
      time: now,
      ingestion_id,
      batch_id,
      ids: batchIds,
    });

    batches.push({
      batch_id,
      ids: batchIds,
      status: 'yet_to_start',
    });
  }

  ingestions[ingestion_id] = {
    status: 'yet_to_start',
    batches,
  };

  // Start the queue processor
  processQueue();

  res.json({ ingestion_id });
});

// GET /status/:ingestion_id
app.get('/status/:ingestion_id', (req, res) => {
  const { ingestion_id } = req.params;
  const data = ingestions[ingestion_id];

  if (!data) return res.status(404).json({ error: 'Invalid ingestion_id' });

  res.json({
    ingestion_id,
    status: data.status,
    batches: data.batches,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
