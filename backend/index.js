require('dotenv').config();
const express = require('express');
const scanRouter = require('./routes/scanRoute');

const app = express();
app.use(express.json());  // Important: parse JSON body

app.use('/api', scanRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
