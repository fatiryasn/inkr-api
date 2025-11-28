const { getIndustries } = require("../controllers/DataController");

const router = require("express").Router();

router.get("/industries", getIndustries);

module.exports = router;
