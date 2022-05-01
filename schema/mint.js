const { timeStamp } = require('console');
const mongoose = require('mongoose');

const MintSchema = new mongoose.Schema(
    {
        staker: {
            type: String,
            required: true,
        },
        mintAddr: {
            type: String,
            required: true
        }
    },
    { timestamps: true },
);
module.exports = mongoose.model('Mint', MintSchema);
