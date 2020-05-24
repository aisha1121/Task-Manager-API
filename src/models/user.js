const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(ans){
            if(!validator.isEmail(ans)){
                throw new Error('Invalid email!')
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        validate(ans){
            if(ans.length<=6){
                throw new Error('Password length must be greater than 6. Try another password! ')
            } else if(ans.includes("password")){
                throw new Error('Try some strong password!')
            }
        }
    },
    age:{
        type:Number,
        default:0,

        validate(number) {
            if(number < 0) {
                throw new Error('Age must be positive')
            }
        }
    },
    tokens:[{
        token : {
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
    
},{
    timestamps:true
})

userSchema.virtual('mytasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userobject = user.toObject()
    delete userobject.password
    delete userobject.tokens
    delete userobject.avatar

    return userobject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id : user._id.toString()} , process.env.JSON_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.getByCredentials = async (email,password) => {
    const user = await User.findOne({email})
    if(!user) {
        throw new Error('Unable to login!')
        //return {error:'Unable to login!'}
    }

    const ismatch = await bcrypt.compare(password,user.password)
    if(!ismatch) {
        throw new Error('Unable to login')
    }
    return user
}

userSchema.pre('save', async function (next) {
    const user = this
    
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password,8)
    }
    next()

})

userSchema.pre('remove' , async function (next) {
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User',userSchema)

module.exports = User