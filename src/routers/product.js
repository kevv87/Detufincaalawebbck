const express = require('express')
const Product = require('../models/product')
const User = require('../models/user')
const Productor = require('../models/productor')
const Region = require('../models/region')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/products', auth.authProductor, async (req, res) => {  //Esto agrega un nuevo tipo de producto
    const product = new Product(req.body)
    try {
        await product.save()
        res.status(201).send(product)
    } catch (e) {
        res.status(400).send(e)
    }
})

async function popularTodosProductos(closeProductores){
          const products = []
          for(var i=0;i<closeProductores.length;i++){
            const stock = closeProductores[i].stock
            for (var j =0;j<stock.length;j++){
              const product = await Product.findOne({_id:stock[j].productId})
              products.push(product)
            }
          }
          let uniqProdName = []
          let uniqProd = []
          products.forEach((item, i) => {
            if(!uniqProdName.includes(item.name)){
              uniqProdName.push(item.name)
              uniqProd.push(item)
            }
          });
          return uniqProd
        }

async function popularSpecificProductos(closeProductores, nameProduct){
  const productores = []
  const product = await Product.findOne({name:nameProduct})
  if(product == null){
    throw "No existe el producto"
  }
  var productor = {}
  var stock = []
  for(var i=0;i<closeProductores.length;i++){
    productor = closeProductores[i]
    stock = productor.stock
    for(var j=0;j<stock.length;j++){
      if(String(stock[j].productId) == String(product._id)){ // Para realizar una comparacion de ids exacta es mejor pasarlos a strings
        productores.push(productor)
        //console.log("p");
      }
    }
  }
  let uniqProdName = []
  let uniqProductores = []
  productores.forEach((item, i) => {
    if(!uniqProdName.includes(item.name)){
      uniqProdName.push(item.name)
      uniqProductores.push(item)
    }
  });
  return uniqProductores
}

router.get('/products',auth.authUser, async(req,res)=>{  // Retorna lo que hay disponible
    try {
      const closeProductores = await Productor.find({region:req.user.region._id}).exec()
      if(req.query.producto == null){
        res.status(201).send(await popularTodosProductos(closeProductores) )
      }else{
        res.status(201).send(await popularSpecificProductos(closeProductores, req.query.producto))
      }
    } catch (e) {
      if(e == "No existe el producto"){
        res.status(400).send(e)
      }else{
        res.status(500).send()
      }
    }
})

// GET /products?completed=true
// GET /products?limit=10&skip=20
// GET /products?sortBy=createdAt:desc
router.get('/MyProducts', auth.authUser, async (req, res) => {
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

router.get('/products/:id', auth.authUser, async (req, res) => {
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

router.patch('/products/:id', auth.authUser, async (req, res) => {
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

router.delete('/products/:id', auth.authUser, async (req, res) => {
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
