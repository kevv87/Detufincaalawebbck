
const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const Productor = require('../models/productor')
const Product = require('../models/product')
const Region = require('../models/region')
const auth = require('../middleware/auth')
const utmObj = require('utm-latlng')
const utm = new utmObj()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

router.post('/productores', async (req, res) => {
    req.body.location = utm.convertLatLngToUtm(req.body.location.lat, req.body.location.lng, 100)
    req.body.region = await Region.findOne(req.body.region.name)
    const productor = new Productor(req.body)
    console.log(productor);
    try {
        await productor.save()
        res.status(201).send({ productor})
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.post('/productores/producto', auth.authProductor, async(req,res)=>{
  try{
    const tipoProducto = await Product.findOne({name:req.body.name})
    const producto = {}
    producto.price = req.body.price
    producto.productId = tipoProducto._id
    producto.name = tipoProducto.name
    var stock = req.user.stock
    if(stock == null){
      stock = []
    }
    stock.push(producto)
    req.user.stock = stock
    await req.user.save()
    res.status(201).send()
  }catch(e){
    console.log(e);
    res.status(500).send()
  }

})

router.post('/productores/login', async (req, res) => {
    try {
        const productor = await Productor.findByCredentials(req.body.email, req.body.password)  // TODO: Cambiar esto a otra cosa
        const token = await productor.generateAuthToken()
        res.send({ productor, token })
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
})

router.post('/productores/logout', auth.authProductor, async (req, res) => {
    try {
        req.productor.tokens = req.productor.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.productor.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/productores/logoutAll', auth.authProductor, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
      console.log(e);
        res.status(500).send()
    }
})

router.get('/productores/me', auth.authProductor, async (req, res) => {
    res.send(req.productor)
})

router.patch('/productores/me', auth.authProductor, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.productor[update] = req.body[update])
        await req.productor.save()
        res.send(req.productor)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/productores/me', auth.authProductor, async (req, res) => {
    try {
        await req.productor.remove()
        sendCancelationEmail(req.productor.email, req.productor.name)
        res.send(req.productor)
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

router.post('/productores/me/avatar', auth.authProductor, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.productor.avatar = buffer
    await req.productor.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/productores/me/avatar', auth.authProductor, async (req, res) => {
    req.productor.avatar = undefined
    await req.productor.save()
    res.send()
})

router.get('/productores/:id/avatar', async (req, res) => {
    try {
        const productor = await Productor.findById(req.params.id)

        if (!productor || !productor.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(productor.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router
