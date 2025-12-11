const { getIndustries, getDisabilities, getSkills } = require("../controllers/DataController");

const router = require("express").Router();

router.get("/industries", getIndustries);

router.get("/disabilities", getDisabilities)

router.get('/skills', getSkills)

module.exports = router;
