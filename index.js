import express from 'express'


const app = express()

app.get('/', (req, res) => {
    res.send('Server is Up')
})

app.listen(process.env.port || 3000)
console.log('listening on http://localhost:' + (process.env.port || 3000))