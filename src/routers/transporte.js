const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Region = require('../models/region')
const Item = require('../models/item')
const Order = require('../models/order')
const Productor = require('../models/productor')
const Transportation = require('../models/transportation')
const auth = require('../middleware/auth')
const utmObj = require('utm-latlng')
const utm = new utmObj()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

// Ver todas las entregas de la region
// Con query mine=true, se ven solo las suyas
router.get('/transporte', auth.authTransport,async (req,res)=>{
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
          if((item.state=="pendingConfirm" && !req.query.mine) || (req.query.mine && item.transportId==req.user._id) ){
            await item.populate({path:'requester'}).execPopulate()
            await item.populate({path:'provider'}).execPopulate()
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

// Agarrar entregas, id de un item.
router.post('/tranporte/:id', auth.authTransport,async(req,res)=>{
  try{
    const item = await Item.findOne({_id:req.params.id})
    if(!item){
      res.status(404).send()
      return
    }else if(item.state != "pendingTransport"){
      res.status(403).send({reason:"El pedido no esta esperando transportista"})
      return
    }
    item.transportId = req.user._id
    item.state = "pendingDelivery"
    await item.save()
    res.send()
  }catch(e){
    res.status(500).send()
  }
})

// Para entregar el pedido
router.patch('/transporte/:id', auth.authTransport, async(req,res)=>{
  try{
    const item = await Item.findOne({_id:req.params.id, transportId:req.user._id})
    if(!item){
      res.status(404).send()
      return
    }else if(item.state != "pendingDeliver"){
      res.status(403).send({reason:"El pedido no esta esperando ser entregado"})
      return
    }

    item.state = "pendingValidation"
    await item.save()
    res.send()
  }catch(e){
    res.status(500).send()
  }
})


// Para abandonar el pedido
router.delete('transporte/:id', auth.authTransport, async(req,res)=>{
  try{
    const item = await Item.findOne({_id:req.params.id, transportId:req.user._id})
    if(!item){
      res.status(404).send()
      return
    }else if(item.state != "pendingDeliver"){
      res.status(403).send({reason:"El pedido no esta esperando ser entregado"})
      return
    }

    item.state = "pendingTransport"

    res.send()
  }catch(e){
    res.status(500).send()
  }
})


module.exports = router
