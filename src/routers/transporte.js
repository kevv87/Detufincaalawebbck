const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Region = require('../models/region')
const Item = require('../models/item')
const Order = require('../models/order')
const Productor = require('../models/productor')
const auth = require('../middleware/auth')
const utmObj = require('utm-latlng')
const utm = new utmObj()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()


router.get('/transporte', async (req,res)=>{
  try{
    const region = await Region.findOne({name:req.query.region})
    const usersRegion = await User.find({region:region})
    const items = []
    for(var i=0;i<usersRegion.length;i++){
      await usersRegion[i].populate({path:'orders'}).execPopulate()
      const orders = usersRegion[i].orders
      for(var j=0;j<orders.length;j++){
        for(var k=0;k<orders[j].items.length;k++){
          const item = await Item.findOne({_id:orders[j].items[k]})
          if(item.state=="pendingConfirm"){
            await item.populate({path:'requester'}).execPopulate()
            items.push(item.toJSON({virtuals:true}))
          }
        }
      }
    }
    res.status(200).send(items)
  }catch(e){
    console.log(e);
    res.status(500).send()
  }
})


module.exports = router
