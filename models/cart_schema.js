const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userCollection"
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productCollection"
        },
        quantity: {
            type: Number,
        }
    }]
});

const cartCollection = mongoose.model("cartCollection", cartSchema);

module.exports = cartCollection;