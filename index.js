var express = require('express');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
const web3_js_1 = require('@solana/web3.js');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const Mint = require('./schema/mint');
const { updateMetaData } = require('./lib/index.js');

app.post('/update', (req, res) => {
    // console.log(web3_js_1.Keypair.fromSecretKey(new Uint8Array(process.env.KEY_150.split(','))));
    updateMetaData(req.body.mintAddr);
    res.send('Successfully updated');
    // const mint = new Mint({ mintAddr: req.body.mintAddr });
    // mint.save().then((a) => console.log('db :', a));
});
const PORT = process.env.PORT || 8008
// app.get('/get');

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

mongoose.connect(
    'mongodb+srv://dragon:aaaaaaaa@cluster0.vuj9o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
);
