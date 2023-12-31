const express = require('express');
const user_router = express.Router();
user_router.use(express.json());
const userError = require('../middleware/userError');
const userAuth = require('../middleware/userAuth');
const userBlock = require('../middleware/userBlock');

const user_home = require('../controller/user_controller/user_home');
const user_login = require('../controller/user_controller/user_login');
const user_signup = require('../controller/user_controller/user_signup');
const user_wishlist = require('../controller/user_controller/user_whishlist');
const user_cart = require('../controller/user_controller/user_cart');
const user_profile = require('../controller/user_controller/user_profile');
const user_address = require('../controller/user_controller/user_address');
const user_order = require('../controller/user_controller/user_order');
const user_checkout = require('../controller/user_controller/user_checkout');
const user_contact = require('../controller/user_controller/user_contact')
const {userProfileUpload} = require('../middleware/multer');

user_router.use('/', express.static('public'));
// user_router.use('/productDetails', express.static('public'));
// user_router.use('/view-order', express.static('public'));


//home
user_router.get('/', userBlock.ifBlocked, user_home.getHomePage);

//login
user_router.get('/login', user_login.getUserLogin);
user_router.post('/postLogin', user_login.postUserLogin);
user_router.get('/logout', user_login.getUserLogout);

//signup
user_router.get('/signup', user_signup.getUserSignup);
user_router.post('/postSignup', user_signup.postUserSignup);

//otp
user_router.get('/sendOtp', user_signup.getSendOtp);
user_router.post('/verifyOtp', user_signup.verifyOTP);

//forgotPassword
user_router.get('/forgotPassword', user_signup.getforgotPassword);
user_router.get('/forgotSendOtp', user_signup.getforgotSendOtp);
user_router.post('/forgotVerifyOtp', user_signup.forgotVerifyOtp);
user_router.post('/forgotChangePassword', user_signup.forgotChangePassword);

//products
user_router.get('/products', userBlock.ifBlocked, user_home.getProducts);
user_router.get('/productDetails/:product_id', userBlock.ifBlocked,  user_home.getProductDetails);
user_router.get('/search-product', user_home.searchProduct);
user_router.get('/filter-product', user_home.filterProduct);

//wishlist
user_router.get('/wishlist', userAuth.userSession, userBlock.ifBlocked, user_wishlist.getWishlist);
user_router.post('/addtoWishlist', userAuth.userSession, userBlock.ifBlocked, user_wishlist.addToWishlist);
user_router.post('/removeFromWishlist', userAuth.userSession, userBlock.ifBlocked, user_wishlist.removeFromWishlist);

//cart
user_router.get('/cart', userAuth.userSession, userBlock.ifBlocked, user_cart.getCart);
user_router.post('/addtoCart', userAuth.userSession, userBlock.ifBlocked, user_cart.addtoCart);
user_router.post('/updateCart', userAuth.userSession, userBlock.ifBlocked, user_cart.updateCart);
user_router.post('/removeFromCart', userAuth.userSession, userBlock.ifBlocked, user_cart.removeCart);

//profile
user_router.get('/profile', userAuth.userSession, userBlock.ifBlocked, user_profile.getProfile);
user_router.post('/edit-profile', userProfileUpload.single('profileImage'), userAuth.userSession, userBlock.ifBlocked, user_profile.editProfile);
user_router.post('/change-password', userAuth.userSession, userBlock.ifBlocked, user_profile.changePassword);

//address
user_router.get('/add-address', userAuth.userSession, userBlock.ifBlocked, user_address.getAddAddress);
user_router.post('/post-add-address', userAuth.userSession, userBlock.ifBlocked, user_address.postAddAddress);
user_router.get('/edit-address', userAuth.userSession, userBlock.ifBlocked, user_address.getEditAddress);
user_router.post('/post-edit-address', userAuth.userSession, userBlock.ifBlocked, user_address.postEditAddress);
user_router.get('/delete-address', userAuth.userSession, userBlock.ifBlocked, user_address.deleteAddress);

//orders
user_router.get('/place-order-cod/:addressId', userAuth.userSession, userBlock.ifBlocked, user_order.orderViaCod);
user_router.get('/place-order-razorpay/:addressId', userAuth.userSession, userBlock.ifBlocked, user_order.orderViaOnline);
user_router.post('/update-payment-status', userAuth.userSession, userBlock.ifBlocked, user_order.updatePaymentStatus);
user_router.get('/place-order-wallet/:addressId', userAuth.userSession, userBlock.ifBlocked, user_order.orderViaWallet);
user_router.get('/view-order', userAuth.userSession, userBlock.ifBlocked, user_order.viewOrders);
user_router.get('/order-placed/:orderId', userAuth.userSession, userBlock.ifBlocked, user_order.getOrderPlaced);
user_router.get('/cancel-order/:orderId', userAuth.userSession, userBlock.ifBlocked, user_order.cancelOrder);
user_router.get('/return-order/:orderId', userAuth.userSession, userBlock.ifBlocked, user_order.returnOrder);
user_router.get('/order-invoice/:orderId', userAuth.userSession, userBlock.ifBlocked, user_order.getInvoice);


//checkout coupon apply
user_router.get('/checkout', userAuth.userSession, userBlock.ifBlocked, user_checkout.checkout);
user_router.get('/apply-coupon', userAuth.userSession, userBlock.ifBlocked, user_checkout.applyCoupon);

//contact
user_router.get('/contact', userBlock.ifBlocked, user_contact.getContactPage);

user_router.use(userError.errorHandler);
user_router.get('/*',userError.errorHandler2);

module.exports = user_router
