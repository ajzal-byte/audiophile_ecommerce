const brandCollection = require('../../models/brand_schema');


// view category
const getBrands = async (req, res)=>{
  try{
      const brands = await brandCollection.find();
      res.render('brand_page', {brands});
  }catch (error) {
    console.error(error);
  }
}

// add category
const addBrands = async (req, res)=>{
  try{
    const brandName = req.query.brandName;
    const ifExist = await brandCollection.findOne({brandName});
  if(ifExist){
    res.status(200).json({error: "Brand already exists"})
  }else{
    
    await brandCollection.create({
      brandName,
      isListed : "Active"
    });
    // res.redirect('/admin/categories');
    res.status(200).json({ success: true });
  }
  }catch (error) {
    console.error(error);
  }
}

//view edit category page
const editBrands = async (req, res)=>{
  try{
    const brand_id = req.params.brand_id;
  const brand_edit = await brandCollection.findById(brand_id);
  res.render('brand_edit', {brand_edit})
  }catch (error) {
    console.error(error);
  }
}


const updateBrands = async (req, res)=>{
  try{
    const brandID = req.query.brandID;
    const brandName = req.query.brandName;
    const ifExist = await brandCollection.findOne({brandName, _id : {$ne:brandID}});
    if(ifExist){   
      res.status(200).json({error: "Brand already exists"})
    }else{
      await brandCollection.findByIdAndUpdate(brandID, {
          brandName,
          isListed: req.body.brand_status
        });
    res.status(200).json({ success: true });
    }
  }catch (error) {
    console.error(error);
  }
}

const blockBrands = async (req, res)=>{
  try{
    const brand_id = req.params.brand_id;
    await brandCollection.findByIdAndUpdate(brand_id, {isListed: 'Inactive'});
    res.redirect('/admin/brands');
  }catch (error) {
    console.error(error);
  }
}

const unblockBrands = async (req, res)=>{
  try{
    const brand_id = req.params.brand_id;
    await brandCollection.findByIdAndUpdate(brand_id, {isListed: 'Active'});
    res.redirect('/admin/brands');
  }catch (error) {
    console.error(error);
  }
}

module.exports = {
  getBrands,
  addBrands,
  editBrands,
  updateBrands,
  blockBrands,
  unblockBrands
}