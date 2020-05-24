const User = require('../models/user')
const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()
const {contactUs} = require('../emails/nodemailer')
const auth = require('../middlewares/auth')


router.post('/users', async (req,res) => {
    const user= new User(req.body)
    try{
        await user.save()
        contactUs({
            email:user.email,
            name:user.name,
            subject:'Welcome greetings!',
            text:`Hii ${user.name}, Welcome to the madworld`
        })
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    } catch (e) {
        res.status(400).send(e)
    }  
})

router.post('/users/login', async (req,res) => {
    try {
        const user = await User.getByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()    //user because it is instance level method
        res.send({user,token})
    } catch (e) {
        res.status(400).send()
    }
})

router.get('/users/me',auth ,async (req,res) => {
    res.send(req.user)

})

router.patch('/users/me' , auth , async (req,res) => {
    
    const upd = Object.keys(req.body)
    const allowedupdates = ['name' , 'email' , 'password' , 'age']
    const isvalidopeartion = upd.every( (update) =>  allowedupdates.includes(update))

    if(!isvalidopeartion) {
        return res.status(400).send({error : 'Enter valid updates!'})
    }

    try {
        //const user = await User.findById(req.params.id)
        upd.forEach( (update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
    
})

router.post('/users/logout',auth,async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutall' , auth , async (req,res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/users/me', auth , async (req,res) => {
try {
    await req.user.remove()
    contactUs({
        email:req.user.email,
        name:req.user.name,
        subject:'Cancellation!',
        text:`Goodbye ${req.user.name}!, I hope to see you soon`
    })
    res.send(req.user)
} catch (e) {
    res.status(404).send(e)
}
})

const upload = multer({
    
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload image'))
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar' ,auth, upload.single('avatar') ,async (req,res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error,req,res,next) => {
        res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar' ,auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar' , async (req,res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-type' , 'image/jpg')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router