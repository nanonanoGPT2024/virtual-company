const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('OK'));
app.listen(4000, () => console.log('Listening on 4000'));
