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

// Registro y login

router.post('/transporte', async (req, res) => {
  try {
    req.body.location = utm.convertLatLngToUtm(req.body.location.lat, req.body.location.lng, 100)
    req.body.region = await Region.findOne(req.body.region.name)
    if(!req.body.region){
      res.status(404).send({reason:"No existe la region "+ req.body.region})
      return
    }
    const transporte = new Transportation(req.body)
    const token = await transporte.generateAuthToken()
            await transporte.save()
        res.status(201).send({ transporte, token:token})
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.post('/transporte/login', async (req, res) => {
    try {
        const transportista = await Transportation.findByCredentials(req.body.email, req.body.password)  // TODO: Cambiar esto a otra cosa
        const token = await transportista.generateAuthToken()
        res.send({ transportista, token })
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
})

router.post('/transporte/logout', auth.authTransport, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/transporte/logoutAll', auth.authTransport, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
      console.log(e);
        res.status(500).send()
    }
})

router.get('/transporte/me', auth.authTransport, async (req, res) => {
    res.send(req.user)
})



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
