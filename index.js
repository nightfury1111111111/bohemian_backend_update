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
const { nextTick } = require('process');

app.get('/', (req, res) => {
    res.send('backend is working well...');
});

app.get('/staked:id', (req, res, next) => {
    const staker = req.params.id;
    Mint.find({ staker }, (err, doc) => {
        if (err) return next(err);
        if (doc.length > 0) res.status(200).send(doc.map((doc) => doc.mintAddr));
        else res.status(404).send({ err: 'Null' });
    });
});

app.get('/reset:id', (req, res, next) => {
    const staker = req.params.id;
    Mint.findOneAndRemove({ staker }, (err, doc) => {
        if (err) return next(err);
        if (doc) res.status(200).send(doc.mintAddr);
        else res.status(404).send({ err: 'Null' });
    });
});

app.post('/unstaked', (req, res, next) => {
    const { staker, mintAddr } = req.body;
    Mint.findOne({ mintAddr }, (err, doc) => {
        if (Date.now() - doc.createdAt <= 3600 * 24 * 7 * 1000) {
            return res.status(400).send("Not yet")
        }
    });
    Mint.findOneAndRemove({ mintAddr }, (err, doc) => {
        if (err) return next(err);
        if (doc) {
            res.status(200).send(doc.mintAddr);
        } else {
            res.status(400).send('no data');
        }
    });
});

app.post('/staked', (req, res, next) => {
    const { staker, mintAddr } = req.body;

    // const mint = new Mint({ mintAddr: req.body.mintAddr });
    Mint.findOne({ mintAddr }, (err, doc) => {
        if (err) return next(err);
        if (doc) {
            return res.status(400).send({ err: 'Duplicate NFT' });
        } else {
            const mint = new Mint({
                staker,
                mintAddr: mintAddr,
            });
            mint.save((err, docs) => {
                if (err) return err;
                res.status(200).send(docs);
            });
        }
    });
    // mint.save().then((a) => console.log('db :', a));
});

app.post('/update', (req, res) => {
    // console.log(web3_js_1.Keypair.fromSecretKey(new Uint8Array(process.env.KEY_150.split(','))));
    try {
        updateMetaData(req.body.mintAddr);
    } catch (err) {
        res.status(400).send(err);
    }
    res.send('Successfully updated');
    // const mint = new Mint({ mintAddr: req.body.mintAddr });
    // mint.save().then((a) => console.log('db :', a));
});
const PORT = process.env.PORT || 8008;
// app.get('/get');

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

mongoose.connect(
    'mongodb+srv://dragon:aaaaaaaa@cluster0.vuj9o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
);
