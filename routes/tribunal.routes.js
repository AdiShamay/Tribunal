const express = require('express');
const {
  handleAdvocate,
  handleJudge
} = require('../controllers/tribunal.controller');

const router = express.Router();

router.post('/advocate', handleAdvocate);
router.post('/judge', handleJudge);

module.exports = router;