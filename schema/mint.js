const mongoose = require('mongoose');

const MintSchema = new mongoose.Schema(
    {
        mintAddr: {
            type: String,
            required: true,
        },
    },
);
module.exports = mongoose.model('Mint', MintSchema);
