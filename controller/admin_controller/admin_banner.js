const bannerCollection = require('../../models/banner_schema');


const getBanners = async (req, res)=>{
  try{
    const banners = await bannerCollection.find();
    res.render('banners-page', {banners});
  }catch(error){
    console.error(error);
  }
}
const getAddBanner = async (req, res)=>{
  try{
    res.render('banner-add.ejs');
  }catch(error){
    console.error(error);
  }
}

const postAddBanner = async (req, res)=>{
  try{
    const { title, subtitle, status, expiryDate } = req.body;
    if(req.file){
      image = `/banner_uploads/${req.file.filename}`;
    }
    await bannerCollection.create({
      title,
      subtitle,
      status,
      expiryDate,
      image,
    });

    res.redirect('/admin/banners');

  }catch(error){
    console.error(error);
  }
}

const getEditBanner = async (req, res)=>{
  try{
    const banner = await bannerCollection.findById(req.params.bannerId)
    res.render('banner-edit.ejs', {banner});
  }catch(error){
    console.error(error);
  }
}

const postEditBanner = async (req, res)=>{
  try{
    const { title, subtitle, status, expiryDate } = req.body;
    const banner = await bannerCollection.findById(req.params.bannerId);
    let image = banner.image;
    if(req.file){
      image = `/banner_uploads/${req.file.filename}`;
    }
    await bannerCollection.findByIdAndUpdate(req.params.bannerId,{
      title,
      subtitle,
      status,
      expiryDate,
      image,
    });

    res.redirect('/admin/banners');

  }catch(error){
    console.error(error);
  }
}

const blockBanner = async (req, res)=>{
  try{
    await bannerCollection.findByIdAndUpdate(req.params.bannerId,{
      status: "Inactive",
    });
    res.redirect('/admin/banners');
  }catch(error){
    console.error(error);
  }
}

const unblockBanner = async (req, res)=>{
  try{
    await bannerCollection.findByIdAndUpdate(req.params.bannerId,{
      status: "Active",
    });
    res.redirect('/admin/banners');
  }catch(error){
    console.error(error);
  }
}

module.exports = {
  getBanners,
  getAddBanner,
  postAddBanner,
  getEditBanner,
  postEditBanner,
  blockBanner,
  unblockBanner,
}