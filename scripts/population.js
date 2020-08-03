// getting-started.js

const mongoose = require('mongoose');
const Region = require('../src/models/region')
const Product = require('../src/models/product')
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('message.txt', 'utf8'));

const provincias = ['AZUAY', 'BOLIVAR', 'CAÑAR', 'CARCHI', 'COTOPAXI', 'CHIMBORAZO', 'EL ORO', 'ESMERALDAS', 'GUAYAS', 'IMBABURA', 'LOJA', 'LOS RIOS', 'MANABI', 'MORONA SANTIAGO', 'NAPO', 'PASTAZA', 'PICHINCHA', 'TUNGURAHUA', 'ZAMORA CHINCHIPE', 'GALAPAGOS', 'SUCUMBIOS', 'ORELLANA', 'SANTO DOMINGO DE LOS TSACHILAS', 'SANTA ELENA']
const productos = [{name:'papa',units:'kilo',category:'verduras'},
{name:'tomate',units:'unidad',category:'frutas'},
{name:'arroz',units:'gramo',category:'granos'},
{name:'brocoli',units:'kilo',category:'verduras'},
{name:'zanahoria',units:'kilo',category:'verduras'}]


mongoose.connect( 'mongodb+srv://productApp:061df3732a@cluster0.k7edn.mongodb.net/test?authSource=admin&replicaSet=atlas-1lqlgh-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true',
 {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})

const meterRegion = async function(newRegion){
  const region = new Region(newRegion)
  await region.save()
}

const meterRegiones = async function(listaRegiones){
  listaRegiones.forEach(async (item, i) => {
    await meterRegion({name:(item.charAt(0) + item.slice(1).toLowerCase() )})
  });
}

const meterProductos = async function(){
  productos.forEach(async (item, i) => {
    const producto = new Product(item)
    await producto.save()
  });

}

meterRegiones(provincias)
meterProductos()

/*const leerJ = async function(){
  var i=0
  while(obj.get(i){
    console.log(obj.get(i));
  }
}*/
