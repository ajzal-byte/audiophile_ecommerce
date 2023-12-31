const addressCollection = require("../../models/address_schema");
const cartCollection = require("../../models/cart_schema");
const userCollection = require("../../models/user_schema");
const orderCollection = require('../../models/orders_schema');
const productCollection = require("../../models/products_schema");
const couponCollection = require("../../models/coupon_schema");
const razorpay = require('razorpay');
const mongoose = require('mongoose');

const { RAZOR_PAY_key_id, RAZOR_PAY_key_secret } = process.env;

//razorpay instance
var instance = new razorpay({
  key_id: RAZOR_PAY_key_id,
  key_secret: RAZOR_PAY_key_secret,
});

const viewOrders = async (req, res, next)=>{
  try{
    const orderId = req.query.orderId;
    const userSession = req.session.user;
    let cartLength;
    let user;
    
    if(userSession){
      user = await userCollection.findOne({email: userSession.email})
      cartLength = await cartCollection.findOne({userId: user._id});
      if (cartLength && cartLength.products) {
        // Check if the cart and its products for the user exists
        cartLength = cartLength.products.length;
      }
    }
    // const userDetails = await userCollection.findOne({email: userSession.email});
    const orderDetails = await orderCollection.findOne({_id: orderId})
    .populate({path: 'products.productId', model: 'Product'});
    let expiryDate = orderDetails.orderDate;
    expiryDate.setDate(expiryDate.getDate() + 10);
    res.render('view-order', {userSession, orderDetails, cartLength, user, expiryDate});
  }catch(error){
    next(error);
  }
}

const getOrderPlaced = async (req, res, next)=>{
  try{
    const userSession = req.session.user;
    const ifOrderExist = await orderCollection.findById(req.params.orderId);
    if(ifOrderExist){
      res.render('order-placed', {userSession});
    }
  }catch(error){
    next(error);
  }
}

const orderViaCod = async (req, res, next)=>{
try{
  let totalAmount = 0;
  let couponDiscount = 0;
  const userSession = req.session.user;
  const user = await userCollection.findOne({email: userSession.email});
  const userAddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
  const userCart = await cartCollection.findOne(
    {userId: user._id}).populate({path: 'products.productId', model:'Product', populate:{path: 'brand', model: 'brandCollection'}});

  userCart.products.forEach(product=>{
    if(product.quantity > product.productId.stock || product.productId.stock == 0){
      return res.status(200).json({backToCart: true})
    }
  });

  const productArray = [];
  userCart.products.forEach(product => {
      productArray.push({
        productId: product.productId._id,
        price: product.productId.salePrice,
        quantity: product.quantity
      })

    });
    
userCart.products.forEach(product=>{
  if (product.productId.offerStatus == 'Active' && product.productId.endDate > Date.now()) {
    let discountPrice = product.productId.salePrice * product.productId.discountPercentage / 100 * product.quantity;
  totalAmount += product.productId.salePrice * product.quantity - discountPrice;
  }else{
    totalAmount += product.productId.salePrice * product.quantity;
  }
})

  const couponCode = req.query.couponCode;
  if(couponCode){
    const coupon = await couponCollection.findOne({couponCode});
    if(!coupon){
      return res.status(200).json({error: "Invalid Coupon"});
    }
    if(coupon.status != 'Active'){
      return res.status(200).json({error: "Coupon is blocked"});
    }
    if(coupon.expiryDate < new Date()){
      return res.status(200).json({error: "Coupon is expired"});
    }
    if(coupon.minimumPurchase > totalAmount){
      return res.status(200).json({error: `Minimum Purchase Amount is ₹${coupon.minimumPurchase}`});
    }
    if (coupon.redeemedUsers.includes(user._id)) {
      return res.status(200).json({ error: "Coupon has already been redeemed" });
    }
      couponDiscount = coupon.discountAmount;
      coupon.redeemedUsers.push(user._id);
      await coupon.save();
  }


  const paymentMethod = "Cash on Delivery"
  //order creation
  const createdOrder = await orderCollection.create({
    userId: user._id, 
    products: productArray,
    totalAmount,
    couponDiscount, 
    paymentMethod,
    address: userAddress,
  })

  //stock updation
  for (const product of userCart.products){
    await productCollection.updateOne(
      {_id : product.productId._id},
      {$inc: {stock: -product.quantity}}
      );
    }

    //cart removal
    await cartCollection.deleteOne({userId: user._id});
    // ID of the created order
    const orderId = createdOrder._id;
    return res.status(200).json({orderId});
  
}catch(error){
  next(error);
}
}

const orderViaOnline = async (req, res, next)=>{
  try{
    let totalAmount = 0;
    let couponDiscount = 0;
    const userSession = req.session.user;
    const user = await userCollection.findOne({email: userSession.email});
    const userAddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
    const userCart = await cartCollection.findOne(
      {userId: user._id}).populate({path: 'products.productId', model:'Product', populate:{path: 'brand', model: 'brandCollection'}});
  
    userCart.products.forEach(product=>{
      if(product.quantity > product.productId.stock || product.productId.stock == 0){
        return res.status(200).json({backToCart: true})
      }
    });
  
    const productArray = [];
    userCart.products.forEach(product => {
        productArray.push({
          productId: product.productId._id,
          price: product.productId.salePrice,
          quantity: product.quantity
        })
  
      });
      
      userCart.products.forEach(product=>{
        if (product.productId.offerStatus == 'Active' && product.productId.endDate > Date.now()) {
          let discountPrice = product.productId.salePrice * product.productId.discountPercentage / 100 * product.quantity;
        totalAmount += product.productId.salePrice * product.quantity - discountPrice;
        }else{
          totalAmount += product.productId.salePrice * product.quantity;
        }
      })
  
    const couponCode = req.query.couponCode;
    if(couponCode){
      const coupon = await couponCollection.findOne({couponCode});
      if(!coupon){
        return res.status(200).json({error: "Invalid Coupon"});
      }
      if(coupon.status != 'Active'){
        return res.status(200).json({error: "Coupon is blocked"});
      }
      if(coupon.expiryDate < new Date()){
        return res.status(200).json({error: "Coupon is expired"});
      }
      if(coupon.minimumPurchase > totalAmount){
        return res.status(200).json({error: `Minimum Purchase Amount is ₹${coupon.minimumPurchase}`});
      }
      if (coupon.redeemedUsers.includes(user._id)) {
        return res.status(200).json({ error: "Coupon has already been redeemed" });
      }
      couponDiscount = coupon.discountAmount;
    }
  
    const paymentMethod = "Online Payment"


    var options = {
      amount: (totalAmount - couponDiscount) * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    const razorOrder = await instance.orders.create(options);

    //order creation
    const createdOrder = await orderCollection.create({
      userId: user._id, 
      orderId: razorOrder.id,
      products: productArray,
      orderStatus: "Order Failed",
      paymentStatus: "Failed",
      totalAmount,
      couponDiscount,
      paymentMethod,
      address: userAddress,
    });


    const createdOrderView = await orderCollection.findById(createdOrder.id);

      // ID of the created order
      const orderId = createdOrder._id;
      return res.status(200).json({razorOrderId: razorOrder.id, orderId});
    
  }catch(error){
    next(error);
  }
}

const updatePaymentStatus = async (req, res, next)=>{
try{
  const userSession = req.session.user;
  const paymentStatus = req.query.paymentStatus;
  const orderId = req.query.orderId;
  await orderCollection.findByIdAndUpdate(orderId, {
    paymentStatus
  })
  if(paymentStatus == "Success"){
    await orderCollection.findByIdAndUpdate(orderId, {
      orderStatus: "Order Placed"
    });
    const user = await userCollection.findOne({email: userSession.email});
    const userCart = await cartCollection.findOne(
    {userId: user._id}).populate({path: 'products.productId', model:'Product', populate:{path: 'brand', model: 'brandCollection'}});

      //stock decreasing
      for (const product of userCart.products){
      await productCollection.updateOne(
        {_id : product.productId._id},
        {$inc: {stock: -product.quantity}}
        );
      }

      //cart removal
      await cartCollection.deleteOne({userId: user._id});

      const couponCode = req.query.couponCode;
      if (couponCode) {
        const coupon = await couponCollection.findOne({couponCode});
        coupon.redeemedUsers.push(user._id);
        await coupon.save();
      }
    return res.status(200).json({paymentStatus: "Success"}); 
  }else{
    return res.status(200).json({paymentStatus: "Failed"});
}
}catch(error){
  next(error);
}
}

const orderViaWallet = async (req, res, next)=>{
try{
  let totalAmount = 0;
  let couponDiscount = 0;
  const userSession = req.session.user;
  const user = await userCollection.findOne({email: userSession.email});
  const userAddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
  const userCart = await cartCollection.findOne(
    {userId: user._id}).populate({path: 'products.productId', model:'Product', populate:{path: 'brand', model: 'brandCollection'}});

  userCart.products.forEach(product=>{
    if(product.quantity > product.productId.stock || product.productId.stock == 0){
      return res.status(200).json({backToCart: true})
    }
  });

  const productArray = [];
  userCart.products.forEach(product => {
      productArray.push({
        productId: product.productId._id,
        price: product.productId.salePrice,
        quantity: product.quantity
      })

    });
    
userCart.products.forEach(product=>{
  if (product.productId.offerStatus == 'Active' && product.productId.endDate > Date.now()) {
    let discountPrice = product.productId.salePrice * product.productId.discountPercentage / 100 * product.quantity;
  totalAmount += product.productId.salePrice * product.quantity - discountPrice;
  }else{
    totalAmount += product.productId.salePrice * product.quantity;
  }
})


  let couponRedeemed;
  const couponCode = req.query.couponCode;
  if(couponCode){
    const coupon = await couponCollection.findOne({couponCode});
    if(!coupon){
      return res.status(200).json({error: "Invalid Coupon"});
    }
    if(coupon.status != 'Active'){
      return res.status(200).json({error: "Coupon is blocked"});
    }
    if(coupon.expiryDate < new Date()){
      return res.status(200).json({error: "Coupon is expired"});
    }
    if(coupon.minimumPurchase > totalAmount){
      return res.status(200).json({error: `Minimum Purchase Amount is ₹${coupon.minimumPurchase}`});
    }
    if (coupon.redeemedUsers.includes(user._id)) {
      return res.status(200).json({ error: "Coupon has already been redeemed" });
    }
      couponDiscount = coupon.discountAmount;
      couponRedeemed = true;
  }

  const userWallet = user.wallet
if(userWallet || userWallet == 0){
  if (userWallet < totalAmount) {
    return res.status(200).json({error: `You need ₹${(totalAmount - userWallet - couponDiscount).toFixed(2)} more in your wallet`});
  }
}

  if (couponRedeemed) {
    const coupon = await couponCollection.findOne({couponCode});
    coupon.redeemedUsers.push(user._id);
      await coupon.save();
  }

  const paymentMethod = "Wallet"
  //order creation
  const createdOrder = await orderCollection.create({
    userId: user._id, 
    products: productArray,
    totalAmount,
    couponDiscount, 
    paymentMethod,
    paymentStatus: "Success",
    address: userAddress,
  });

  await userCollection.findByIdAndUpdate(user._id, {
    $inc:{wallet: -totalAmount}
  });

  //stock updation
  for (const product of userCart.products){
    await productCollection.updateOne(
      {_id : product.productId._id},
      {$inc: {stock: -product.quantity}}
      );
    }

    //cart removal
    await cartCollection.deleteOne({userId: user._id});
    // ID of the created order
    const orderId = createdOrder._id;
    return res.status(200).json({orderId});
  
}catch(error){
  next(error);
}
}

const cancelOrder = async (req, res, next)=>{
  try{
    const orderId = req.params.orderId;
    const order = await orderCollection.findById(orderId);
    if (order) {
      for (const product of order.products) {
        await productCollection.updateOne(
          { _id: product.productId },
          {$inc: {stock: product.quantity}}
        );
      }
    }
    if(order.paymentMethod == "Online Payment" || order.paymentMethod == "Wallet"){
      const user = await userCollection.findOne({_id: order.userId});
      if(user){
        if(user.wallet){
          await userCollection.updateOne(
          {_id: order.userId},
          {$inc: { wallet: order.totalAmount }});
        }else{
          await userCollection.updateOne(
          {_id: order.userId},
          {$set: { wallet: order.totalAmount }});
        }
      }
    }
    await orderCollection.findByIdAndUpdate(orderId, {orderStatus: 'Cancelled', paymentStatus: 'Failed'});
    res.redirect(`/view-order/?orderId=${orderId}`);
  }catch (error) {
    next(error);
  }
}

const returnOrder = async (req, res, next)=>{
  try{
    const orderId = req.params.orderId;
    const order = await orderCollection.findById(orderId);
    if(req.query.returnReason != "defective"){
      if (order) {
        for (const product of order.products) {
          await productCollection.updateOne(
            { _id: product.productId },
            {$inc: {stock: product.quantity}}
          );
        }
      }
    }
    if(order.paymentMethod == "Online Payment"){
      const user = await userCollection.findOne({_id: order.userId});
      if(user){
        if(user.wallet){
          await userCollection.updateOne(
          {_id: order.userId},
          {$inc: { wallet: order.totalAmount }});
        }else{
          await userCollection.updateOne(
          {_id: order.userId},
          {$set: { wallet: order.totalAmount }});
        }
      }
    }
    await orderCollection.findByIdAndUpdate(orderId, {orderStatus: 'Returned', paymentStatus: 'Failed'});
    res.redirect(`/view-order/?orderId=${orderId}`);
  }catch (error) {
    next(error);
  }
}

const getInvoice = async (req, res)=>{
  const order = await orderCollection.findById(req.params.orderId).populate({path: 'products.productId', model:'Product', populate:{path: 'brand', model: 'brandCollection'}});
  res.render('invoice', {order});
}

module.exports = {
  viewOrders,
  getOrderPlaced,
  orderViaCod,
  orderViaOnline,
  updatePaymentStatus,
  orderViaWallet,
  cancelOrder,
  returnOrder,
  getInvoice
}