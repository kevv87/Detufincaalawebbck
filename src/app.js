const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const productRouter = require('./routers/product')
const productorRouter = require('./routers/productor')
const regionRouter = require('./routers/region')
const transporteRouter = require('./routers/transporte')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(productRouter)
app.use(productorRouter)
app.use(regionRouter)
app.use(transporteRouter)

module.exports = app
