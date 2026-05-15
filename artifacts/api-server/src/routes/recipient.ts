import { Router } from "express";

const router = Router();

router.get("/recipient", (req, res) => {
  const address = process.env.RECIPIENT_ADDRESS;
  if (!address) {
    req.log.error("RECIPIENT_ADDRESS environment variable is not set");
    res.status(500).json({ error: "Recipient address is not configured on the server." });
    return;
  }
  res.json({ address });
});

export default router;
