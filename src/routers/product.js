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
        e = {error:"No existe el producto"}
        res.status(404).send(e)
      }else{
        res.status(500).send()
      }
    }
})

router.get('/productores/allProducts', auth.authProductor, async(req,res)=>{
  try {
      const productos = await Product.find({})
      res.send(productos)
    } catch (e) {
      if(e == "No existe el producto"){
        e = {error:"No existe el producto"}
        res.status(404).send(e)
      }else{
        res.status(500).send()
      }
    }
})

// GET /products?completed=true
// GET /products?limit=10&skip=20
// GET /products?sortBy=createdAt:desc
router.get('/MyProducts', auth.authProductor, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        res.send(req.user.stock)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/products/:id', auth.authProductor, async (req, res) => {
      const _id = req.params.id

    try {
        const stock = req.user.stock
        const product = stock.find(element=>
          String(_id) == String(element._id)
        )

        console.log(product);

        if (!product) {
            return res.status(404).send()
        }

        res.status(201).send(product)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/products/:id', auth.authProductor, async (req, res) => {
        const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['price']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        var indexFound = 0
        const product = req.user.stock.find((element)=>
          String(element._id) == String(_id)
        )

        if (!product) {
            return res.status(404).send()
        }

        updates.forEach((update) => product[update] = req.body[update])
        req.user.stock[indexFound] = product
        await req.user.save()
        res.send(product)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/products/:id', auth.authProductor, async (req, res) => {
    const _id = req.params.id
    try {
        req.user.stock = req.user.stock.filter((element)=>{
          String(element._id) != String(_id)
        })

        await req.user.save()

        return res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/products', auth.authProductor, async (req, res) => {
    const _id = req.params.id
    try {
        req.user.stock = []

        await req.user.save()

        return res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
