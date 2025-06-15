const mongo=require('mongoose');
const userschema=mongo.Schema({
    name:String,
    number:String,
    password:String

})

module.exports= mongo.model('owner_profile',userschema);