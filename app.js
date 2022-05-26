require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const port = 3000


const app = express()
app.use(express.json())

//Models
const Usuario = require('./models/Usuario')

//public router
app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Bem vindo' })
})

//private router

app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id
    //checar usuario
    const user = await Usuario.findById(id, '-password')
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' })
    }
    res.status(200).json({ user })

})
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Acesso Negado!' })
    }
    try {
        const secret = process.env.SECRET
        jwt.verify(token, secret)
        next()

    } catch (error) {
        res.status(400).json({ message: 'Token Inválido!' })
    }
}

app.post('/auth/register', async (req, res) => {
    const { nome, email, password, confirmpassword } = req.body;
    if (!nome) {
        return res.status(422).json({ message: 'O Nome é Obrigatório' })
    } else if (!email) {
        return res.status(422).json({ message: 'Email é Obrigatório' })
    } else if (!password) {
        return res.status(422).json({ message: 'Senha é Obrigatório' })
    } else if (!confirmpassword) {
        return res.status(422).json({ message: 'Confirmação da Senha é Obrigatório' })
    } else if (password !== confirmpassword) {
        return res.status(422).json({ message: 'Senha e Confirmação são diferentes' })
    }
    const userExists = await Usuario.findOne({ email: email })
    if (userExists) {
        return res.status(422).json({ message: 'Este email já está cadastrado!' })
    }
    const salt = await bcrypt.genSalt(12)
    const passwrodHash = await bcrypt.hash(password, salt)
    const usuario = new Usuario({
        nome,
        email,
        password: passwrodHash,
    })
    try {
        await usuario.save()
        res.status(201).json({ message: 'Usuário Criado com Sucesso!' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Ocorreu um erro ao cadastrar o usuário!' })
    }
})

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    //validações

    if (!email) {
        return res.status(422).json({ message: 'Email é Obrigatório' })
    } else if (!password) {
        return res.status(422).json({ message: 'Senha é Obrigatório' })
    }
    const user = await Usuario.findOne({ email: email })
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' })
    }

    //checar senha

    const checkSenha = await bcrypt.compare(password, user.password)
    if (!checkSenha) {
        return res.status(422).json({ message: 'Senha Inválida!' })
    }
    try {
        const secret = process.env.SECRET
        const token = jwt.sign({
            id: user._id,
        }, secret,
        )
        res.status(200).json({ message: 'Autenticação realizada com Sucesso!', token })

    } catch (error) {
        return res.status(500).json({ message: 'Ocorreu um erro na autenticação!' })
    }

})

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS
const url = `mongodb+srv://${dbUser}:${dbPassword}@clusterjwt.dizduvx.mongodb.net/dbtk?retryWrites=true&w=majority`

mongoose.connect(url).then(() => {
    app.listen(port, () => { console.log(`Servidor rodando na porta: ${port}`) })
    console.log('Conectado ao Banco de Dados')
}).catch((err) => console.log(err))
