const mongoose = require("mongoose") 

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection",
    required: true,
  },
  orderId: {
    type: String,
  },
  products:[
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productCollection",
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  orderDate: {
    type: Date,
    default: Date.now(),
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  couponDiscount: {
    type: Number,
  },
  orderStatus: {
    type: String,
    enum: ["Order Placed", "Order Failed", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Order Placed",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending","Success","Failed"],
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  address: {
    type: Object,
    required: true,
  },
  cancelReason: {
    type: String,
  },
  deliveryDate:{
    type: Date,
  }
},
{ timestamps: true }
);

const orderCollection = mongoose.model("orderCollection", orderSchema)
module.exports = orderCollection;