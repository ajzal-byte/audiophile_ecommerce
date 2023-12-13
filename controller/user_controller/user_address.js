const userCollection = require("../../models/user_schema");
const addressCollection = require('../../models/address_schema')
const cartCollection = require('../../models/cart_schema');

module.exports.getAddAddress = async (req, res, next)=>{
try{
  const source = req.query.source;
  const userSession = req.session.user;
  let cartLength;
  if(userSession){
    const user = await userCollection.findOne({email: userSession.email})
    cartLength = await cartCollection.findOne({userId: user._id});
    cartLength = cartLength.products.length;
  }
  const user = userCollection.findOne({email: userSession.email});
  res.render('add-address', {userSession, user, source, cartLength})
}catch(error){
  next(error);
}
}

module.exports.postAddAddress = async (req, res, next)=>{
try{
  const source = req.query.source;
  const {name, addressType, city, landMark, state, pincode, phone, altPhone} = req.body;
  console.log(req.body);
  const userSession = req.session.user;
  const user = await userCollection.findOne({email: userSession.email});
  const userAddress= await addressCollection.findOne({userId: user._id});
  if(userAddress){
    userAddress.address.push({name, addressType, city, landMark, state, pincode, phone, altPhone});
    await userAddress.save()
  }else{
    await addressCollection.create({
      userId: user._id,
      address:[{name, addressType, city, landMark, state, pincode, phone, altPhone}]
    });
    // res.status(200).json({message: "Address added"});
  }
  if(source){
    return res.redirect('/profile')
  }
  res.redirect('/checkout')

}catch(error){
  next(error);
}
}

module.exports.getEditAddress = async (req, res, next)=>{
try{
  const userSession = req.session.user;
  let cartLength;
  if(userSession){
    const user = await userCollection.findOne({email: userSession.email})
    cartLength = await cartCollection.findOne({userId: user._id});
    cartLength = cartLength.products.length;
  }
  const user = await userCollection.findOne({email: userSession.email});
  const addressId = req.query.addressId;
  const objectId = req.query.objectId;
  const userAddress = await addressCollection.findOne({userId: user._id, "address._id": addressId}, { "address.$": 1 });
  if (userAddress && userAddress.address){
    res.render('edit-address', {userSession, userAddress, cartLength})
  }else {
    console.log('Address not found');
  }
}catch(error){
  next(error);
}
}


module.exports.postEditAddress = async (req, res, next)=>{
  try{
    const {name, addressType, city, landMark, state, pincode, phone, altPhone} = req.body;
    console.log(req.body);
    const userSession = req.session.user;
    const addressId = req.query.addressId;
    const user = await userCollection.findOne({email: userSession.email});
    const userAddress = await addressCollection.findOneAndUpdate(
  { "address._id": addressId },
  {
    $set: {
      "address.$.addressType": addressType,
      "address.$.name": name,
      "address.$.city": city,
      "address.$.landMark": landMark,
      "address.$.state": state,
      "address.$.pincode": pincode,
      "address.$.phone": phone,
      "address.$.altPhone": altPhone,
    },
  }
);

    res.redirect('/profile')
  
  }catch(error){
    next(error);
  }
}

module.exports.deleteAddress = async (req, res, next)=>{
try{
  const userSession = req.session.user;
  const addressId = req.query.addressId;
  const user = await userCollection.findOne({email: userSession.email});
  const userAddress = await addressCollection.updateOne({userId: user._id},
  {$pull:{ address:{
    _id: addressId
  }
  }});
  res.redirect('/profile');
}catch(error){
  next(error);
}
}