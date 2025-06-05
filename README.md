# 📦 Ingestion Priority API System

This project implements a priority-based asynchronous ingestion system with rate-limited batch processing. Built using **Node.js** and **Express**, it simulates processing IDs with different priorities, while honoring a strict rate limit and processing order.

---

## 🚀 Features

- RESTful API with two endpoints: `/ingest` and `/status/:ingestion_id`
- Prioritized processing based on `HIGH > MEDIUM > LOW`
- Processes **up to 3 IDs per batch**
- Enforces **1 batch per 5 seconds** rate limit
- Asynchronous job queue with time-based and priority-based scheduling
- In-memory job tracking (can be swapped with a DB later)
- Status endpoint to track batch progress: `yet_to_start`, `triggered`, `completed`

---

## 📬 API Endpoints

### 📥 `POST /ingest`

**Description:** Enqueues IDs for processing.

#### ✅ Request

```json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH"
}
