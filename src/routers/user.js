const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const Region = require('../models/region')
const Item = require('../models/item')
const Order = require('../models/order')
const auth = require('../middleware/auth')
const utmObj = require('utm-latlng')
const utm = new utmObj()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()


// Login, logout y signup
router.post('/users', async (req, res) => {
    req.body.location = utm.convertLatLngToUtm(req.body.location.lat, req.body.location.lng, 100)
    req.body.region = await Region.findOne(req.body.region.name)
    const user = new User(req.body)
    console.log(user);
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ user })
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
})

router.post('/users/logout', auth.authUser, async (req, res) => {
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

router.post('/users/logoutAll', auth.authUser, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


// My info
router.get('/users/me', auth.authUser, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth.authUser, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth.authUser, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth.authUser, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth.authUser, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

// Carrito y ordenes
router.post('/users/carrito', auth.authUser, async(req,res)=>{
  try{

    const newItems = []
    var productor = {}
    var stock = {}
    var item = {}
    // El request body es ua lista de stock, quantity
    var i = 0
    for (i=0;i<req.body.items.length;i++){
      reqStock = req.body.items[i].stock
      productor = await Productor.findOne({stock:reqStock})  // Devuelve los productores cuyo stock incluye reqStock
      item = new Item({
        productorId:productor._id,
        productId:reqStock.productId,
        quantity:req.body[i].quantity,
        totalPrice:req.body[i].quantity*reqStock.price,
        state:"Pendiente confirmacion"
      })
      newItems.push(item)
      await item.save()
    }
    const order = new Order({
      limitDate: req.body.limitDate,
      consumerId: user._id,
      items:newItems
    })
    await order.save()
  }catch(e){
    res.status(500).send(e);
  }
})

module.exports = router
