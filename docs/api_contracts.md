# ConceptCraft AI - API Contracts (Draft)

This document outlines the communication contract between the **Frontend (Next.js)**, **Core Backend (Express.js)**, and **AI Backend (FastAPI)**.

---

## 🔐 Auth & User Routes (Express.js - `ms1-core-api`)

All requests except `/api/auth/login` and `/api/auth/signup` require a Bearer token in the `Authorization` header.

### 1. User Signup
* **Endpoint:** `POST /api/auth/signup`
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "name": "Harshit",
    "interests": ["cricket", "gaming"] 
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully. Verification email sent.",
    "userId": "usr_9812739"
  }
  ```

### 2. User Login
* **Endpoint:** `POST /api/auth/login`
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "usr_9812739",
      "email": "user@example.com",
      "name": "Harshit",
      "role": "STUDENT"
    }
  }
  ```

---

## 🧠 Concept & Learning Routes (Express.js ↔ FastAPI)

### 1. Request Concept Decomposition
Used when a student inputs an abstract topic they want to learn.
* **Endpoint:** `POST /api/concepts/generate`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "conceptName": "Binary Search",
    "customInterest": "Cricket"
  }
  ```
* **Processing:** 
  - Express.js logs the request.
  - Express.js forwards the request to FastAPI (`POST /agent/decompress`).
  - Express.js saves the result to PostgreSQL and returns it.
* **Response (200 OK):**
  ```json
  {
    "conceptId": "con_12345",
    "conceptName": "Binary Search",
    "analogyUsed": "Finding a specific player's card from a sorted deck of cricket players",
    "prerequisites": ["Arrays", "Sorting"],
    "decomposition": {
      "coreIdea": "Dividing search space in half repeatedly...",
      "steps": [
        { "step": 1, "title": "Find the middle element", "desc": "Check if middle matches target..." }
      ]
    },
    "smartNotes": "### Quick Summary \n Binary search operates on sorted arrays..."
  }
  ```

---

## 📝 Quiz Routes (Express.js)

### 1. Submit Quiz Answers
* **Endpoint:** `POST /api/quizzes/:conceptId/submit`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "answers": [
      { "questionId": "q_1", "selectedOption": "B" },
      { "questionId": "q_2", "selectedOption": "A" }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "score": 80,
    "passed": true,
    "feedback": "Great job! You understand how the range limits shift.",
    "weakAreas": []
  }
  ```
* *Note: If score < 60%, the response will trigger the client to suggest a regenerated, simpler analogy.*

---

## 🤖 Internal AI Agent endpoints (FastAPI - `ms2-vision-agent`)

These endpoints are called **only** by the Express backend.

### 1. Process 5-Agent Graph
* **Endpoint:** `POST /agent/process-pipeline`
* **Request Body:**
  ```json
  {
    "conceptName": "Binary Search",
    "userInterests": ["cricket"],
    "difficultyLevel": "beginner",
    "previousScore": null
  }
  ```
* **Response (200 OK):** Contains the full LangGraph state including Deconstructed tree, analogy logic, D3.js JSON structure, quiz questions, and resource recommendations.
