import { Router } from "express";

const router = new Router();

// Proxy routes to doctor backend for live features
router.post("/chat/send", async (req, res) => {
  try {
    const response = await fetch("http://localhost:5001/api/v1/live/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for chat send:", error);
    res.status(500).json({ error: "Failed to proxy chat message" });
  }
});

router.get("/chat/history/:appointmentId", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:5001/api/v1/live/chat/history/${req.params.appointmentId}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for chat history:", error);
    res.status(500).json({ error: "Failed to proxy chat history" });
  }
});

router.post("/call/start/:appointmentId", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:5001/api/v1/live/call/start/${req.params.appointmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for start call:", error);
    res.status(500).json({ error: "Failed to proxy start call" });
  }
});

router.post("/call/end/:appointmentId", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:5001/api/v1/live/call/end/${req.params.appointmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for end call:", error);
    res.status(500).json({ error: "Failed to proxy end call" });
  }
});

router.post("/status/:appointmentId", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:5001/api/v1/live/status/${req.params.appointmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for status update:", error);
    res.status(500).json({ error: "Failed to proxy status update" });
  }
});

router.get("/status/:appointmentId", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:5001/api/v1/live/status/${req.params.appointmentId}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error for status get:", error);
    res.status(500).json({ error: "Failed to proxy status get" });
  }
});

export default router;