const express = require('express')
const tasks = require('../models/task')
const auth = require('../middlewares/auth')
const router = new express.Router()

router.post('/tasks',auth, async (req,res) => {
    const task = new tasks({
        ...req.body,
        owner:req.user._id
    })
    try {
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }   
})

router.patch('/tasks/:id' ,auth, async (req,res) => {
    
    const upd = Object.keys(req.body)
    const allowedupdates = ['description' , 'completed']
    const isvalidopeartion = upd.every( (update) =>  allowedupdates.includes(update))

    if(!isvalidopeartion) {
        return res.status(400).send({error : 'Enter valid updates!'})
    }

    try {
        //const task = await tasks.findById(req.params.id)
        const task = await tasks.findOne({_id:req.params.id,owner:req.user._id})
        if(!task) {
            return res.status(404).send('Task not found')
        }
        upd.forEach( (update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
    
})

// GET /taksks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt_desc
router.get('/tasks',auth, async (req,res) => {
    const match = {}                                //match is an object whose completed we will specify
    const sort = {}
    
    if(req.query.completed) {
        match.completed = req.query.completed ==='true'
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }

    try {
        //const task = await tasks.find({owner:req.user._id})
        await req.user.populate({
            path : 'mytasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.mytasks)
    } catch (e){
        res.status(500).send()
    } 
})

router.get('/tasks/:id', auth , async (req,res) => {
    const _id = req.params.id
    try {
        const task = await tasks.findOne({
            _id,
            owner:req.user._id
        })
        if(!task) {
            return res.status(404).send()
        }
    res.send(task)
    } catch (e){
        res.status(500).send()
    }
    
})

router.delete('/tasks/:id' ,auth, async (req,res) => {
    try {
        const task = await tasks.findOneAndDelete({_id:req.params.id,owner:req.user._id})
        if(!task) {
            return res.status(404).send('Id not found')
        }
        res.send(task)
    } catch (e) {
        res.status(404).send(e)
    }
})

module.exports = router