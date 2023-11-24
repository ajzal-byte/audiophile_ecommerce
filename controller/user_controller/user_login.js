const userCollection = require('../../models/user_schema');
const productCollection = require('../../models/products_schema')
const nodemailer = require('nodemailer');
// const { v4: uuidv4 } = require('uuid');
// const transporter = require('../emailConfig');


module.exports.getUserLogin = async (req, res)=>{
  try{
    const userSession = req.session.user;
    const products = await productCollection.find()
    if(userSession){
      res.render('user_index', {userSession, products})
    }else{
      res.render('user_login', {userSession});
    }
  }catch (error) {
    console.error(error);
  }
};


module.exports.postUserLogin = async (req, res)=>{
  try{
    const email = req.query.email;
    const password = req.query.password;
    console.log(email)
    console.log(password)
    const data = await userCollection.findOne({ email});
    if(!data){
    res.status(200).json({ error: "This email is not registered" });
    }else if(data){
      if(data.status == 'Inactive'){
        res.status(200).json({ error: "This user is blocked" });
      }else if(password !== data.password){
        res.status(200).json({ error: "Incorrect Password" });
      }else{
        req.session.user = {
        email: email,
        username: data.username 
      };
      res.status(200).json({ success: true });
      }
    }
  }catch(error){
    console.error(error);
  }
}



module.exports.getUserLogout = async (req, res)=>{
  try{
    req.session.destroy()
  res.redirect('/login')
  }catch (error) {
    console.error(error);
  }
};


module.exports.getUserSignup = async (req, res)=>{
  try{
    res.render('user_signup')
  }catch (error) {
    console.error(error);
  }
}                                                                                                                                                              


module.exports.postUserSignup = async (req, res)=>{
  try{
    const {username, email, password, phoneNumber} = req.body;
    await userCollection.create({
     username,
      email,
      password,
      phoneNumber,
      status : "Active"
    });
    res.redirect('/login')
  }catch(error){
    console.error(error);
  }
};


//otp generator function
let generatedOTP = null;
const generateOTP = () => {
  // Generate a random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports.getSendOtp = async (req, res)=>{
  try{
    const phoneNumber = req.query.phoneNumber;
    const ifExist = await userCollection.findOne({
      $or: [
        {email : req.query.email},
        {phoneNumber : req.query.phoneNumber}
      ]
    });
    if(ifExist){
      res.status(200).json({error: "User already exists"})
    }else{
      const email = req.query.email;
      generatedOTP = generateOTP();

      // Create a transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

        // Compose and send an email
        const mailOptions = {
          from:{
            name : "audiophile",
            address : process.env.EMAIL_USER,
          },
          to: email,
          subject: 'OTP for Account Verification',
          text: `Your OTP is: ${generatedOTP}`,
        };
      
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
          } else {
            console.log('Email has been sent: ' + info.response);
          }
        });

        res.status(200).json({message : "OTP send to email successfully"})
    }
  }catch (error) {
    console.error(error);
  }
}

//verify OTP

module.exports.verifyOTP = async (req, res)=>{
  try{
    let userEnteredOTP = req.query.otpInput;
    if(userEnteredOTP === generatedOTP){
      res.status(200).json({message: "OTP Verification Successfull"});
    }else{
      res.status(400).json({error: "Incorrect OTP"});
    }
  }catch(error){
    console.error(error)
  }
};


//single product page

module.exports.getProductDetails = async (req, res)=>{
  try{
    console.log(req.session.user)
    const userSession = req.session.user;
    // console.log('userSession:', userSession);
    const product_id = req.params.product_id;
    const product_details = await productCollection.findOne({_id : product_id})
    // console.log(product_details);
    res.render('product_view', {product_details, userSession});
  }catch(error){
    console.error(error);
  }
}

// view forgot password page
module.exports.getforgotPassword = async (req, res)=>{
  try{
    res.render('forgot_password');
  }catch(error){
    console.log('error')
  }
}


// send otp for forgot password
module.exports.getforgotSendOtp = async (req, res)=>{
  try{
    const ifExist = await userCollection.findOne({email: req.query.email});
    if(!ifExist){
      res.status(200).json({error: "This email is not registered"});
    }else{
      const email = req.query.email;
    generatedOTP = generateOTP();

     // Create a transporter
     const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

      // Compose and send an email
      const mailOptions = {
        from:{
          name : "audiophile",
          address : process.env.EMAIL_USER,
        },
        to: email,
        subject: 'OTP for Account Verification',
        text: `Your OTP is: ${generatedOTP}`,
      };
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email has been sent: ' + info.response);
        }
      });

      res.status(200).json({message : "OTP send to email successfully"})
    }
    

  }catch(error){
    console.error(error);
  }
}

// verify otp for forgot password
module.exports.forgotVerifyOtp = async (req, res)=>{
  try{
    let userEnteredOTP = req.query.otpInput;
    if(Number(userEnteredOTP) == Number(generatedOTP)){
      return res.status(200).json({message: "OTP Verification Successfull"});
    }else{
      return res.status(400).json({message: "Incorrect OTP"});
    }
  }catch(error){
    console.log(error);
  }
}

// changing the forgotten password
module.exports.forgotChangePassword = async (req, res)=>{
  try{
      const email = req.query.email;
      const newPassword = req.query.password;
      const user = await userCollection.findOne({email});
     if(newPassword == user.password){
       return res.status(200).json({same:true})
     }else{
        await userCollection.updateOne({email}, {$set:{password: newPassword}})
        return res.status(200).json({same: false});
    }
  }catch(error){
    console.error(error)
  }
}
