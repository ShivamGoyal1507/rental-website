const mongo=require('mongoose');

mongo.connect(`mongodb://127.0.0.1:27017/user`);

const userschema=mongo.Schema({
    name:String,
    number:String,
    email:String,
    password:String

})

module.exports= mongo.model('login_user',userschema);