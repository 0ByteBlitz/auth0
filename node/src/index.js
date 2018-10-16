//import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('express-jwt');
const jwksrsa = require('jwks-rsa');
//define the express app

const app = express();

//database
const questions = [];

//security enhancement using Helmet

app.use(helmet());

//use bodyParse to parse application/json content-type
app.use(bodyParser.json());

//enable all CORS requests
app.use(cors());

//log HTTP requests
app.use(morgan('combined'));

//retreive all questions
app.get('/', (req, res) => {
    const qs = questions.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        answers: q.answers.length,
    }));
    res.send(qs);
});

//get a specific question
app.get('/:id', (req, res) => {
    const question = questions.filter(q => (q.id === parseInt(req.params.id)));
    if(question.length > 1) return res.status(500).send();
    if(question.length === 0) return res.status(400).send();
    res.send(question[0]);
});

//middleware to validate ID tokens
const checkJwt = jwt({
    secret: jwksrsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://mukes.auth0.com/.well-known/jwks.json`
    }),

    //validate the audience and the issuer
    audience: '0Rr25reiKmCfiRA7mKSZimAxZfmsUVs8',
    issuer: `https://mukes.auth0.com/`,
    algorithms: ['RS256']
});


//insert a new question
app.post('/', checkJwt, (req, res) => {
    const {title, description} = req.body;
    const newQuestion = {
        id: questions.length + 1,
        title,
        description,
        answers: [],
        author: req.user.name, 
    };
    questions.push(newQuestion);
    res.status(200).send();
});

//insert a new answer to a question
app.post('/answer/:id', checkJwt, (req, res) => {
    const {answer} = req.body;
    const question = questions.filter(q => (q.id === parseInt(req.params.id)));
    if (question.length > 1) return res.status(500).send();
    if (question.length === 0) return res.status(404).send();

    question[0].answers.push({
        answer,
        author: req.user.name,
    });

    res.status(200).send();
});

//start the server
app.listen(8090, () => {
    console.log('server listening on port 8090');
});