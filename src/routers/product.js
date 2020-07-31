const express = require('express')
const Product = require('../models/product')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/products', auth, async (req, res) => {
    const product = new Product({
        ...req.body,
        owner: req.user._id
    })

    try {
        await product.save()
        res.status(201).send(product)
    } catch (e) {
        res.status(400).send(e)
    }
})

function popularProductos(closeProductores){
  return new Promise(resolve=>{
          const products = []
          for(var i=0;i<closeProductores.length;i++){
            const product = Product.find({owner:closeProductores[i]._id}).exec()
            products.push(product)
            console.log(products);
          }
          //console.log(products);
          resolve(products)
        })
}

router.get('/products',auth, async(req,res)=>{
    try {
        const closeProductores = await User.find({tipo:"productor",region:req.user.region}).exec()
        const x = await popularProductos(closeProductores)
        res.send(x)
    } catch (e) {
      console.log(e);
      res.status(500).send()
    }
})

// GET /products?completed=true
// GET /products?limit=10&skip=20
// GET /products?sortBy=createdAt:desc
router.get('/MyProducts', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'products',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.products)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/products/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const product = await Product.findOne({ _id, owner: req.user._id })

        if (!product) {
            return res.status(404).send()
        }

        res.send(product)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/products/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const product = await Product.findOne({ _id: req.params.id, owner: req.user._id})

        if (!product) {
            return res.status(404).send()
        }

        updates.forEach((update) => product[update] = req.body[update])
        await product.save()
        res.send(product)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!product) {
            res.status(404).send()
        }

        res.send(product)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
