const router = require("express").Router();
const { subscribe } = require("../controllers/subscriberController");
const { generalLimiter } = require("../middleware/rateLimiter");

router.post("/", generalLimiter, subscribe);

module.exports = router;