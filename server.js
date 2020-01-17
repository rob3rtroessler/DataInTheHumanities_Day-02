// requirements for basic nlp in js
const fs = require('fs');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const extract = require('extract-lemmatized-nonstop-words');

let freud;


// preparation
fs.readFile('sample.txt', (err, data) => {
    if (err) throw err;

    console.log('starting freud lemmatization');
    freud = extract(data.toString());
    console.log('freud lemmatization done');
});

// database
const sqlite3 = require('sqlite3');

// requirements for the actual js server using express
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// express setup
app.use(bodyParser.json());
app.use('/static', express.static('static'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
});

app.post('/getData', (req, res) => {

    let keyword = req.body.keyword;
    let myData = {};

    // read the text
    fs.readFile('sample.txt', (err, data) => {
        if (err) throw err;

        //console.log(data);
        let string = data.toString();
        let tokens = tokenizer.tokenize(string);
        console.log(tokens);

        let hits = [];

        tokens.forEach(function (d,i) {
            if ( d === keyword ){
                hits.push(i);
                console.log('hit at', i)
            }
        });

        console.log('hits: ', hits);

        let concordances = makeConcordances(tokens, hits, 7);
        console.log(concordances);
        myData['freud'] = concordances;
        res.send(myData);
    });
});


app.post('/getLemma', (req, res) => {

    let keyword = req.body.keyword;
    let myData = {};
    let hits = [];

    freud.forEach(function (d,i) {
        if ( d.lemma === keyword ){
            hits.push(i);
            console.log('hit at', i)
        }
    });

    console.log('hits: ', hits);

    let concordances = makeConcordances(freud, hits, 7);
    console.log(concordances);
    myData['freud'] = concordances;
    res.send(myData);
});


app.listen(5000, function () {
    console.log('Example app listening on port 5000!');
});



// helper function that creates concordances based on three inputs (the tokenized text itself, the precomputed hits and the range)
function makeConcordances(tokenizedText, hits, range){

    let concordances = [];

    //take the x before and the x after
    hits.forEach(function(position){

        // concordance array
        let tmpConcordanceArray = [];

        // loop
        for (let i = position - range; i <= position + range; i++){
            if (tokenizedText[i]){
                tmpConcordanceArray.push(tokenizedText[i]);
            }
            else {
                console.log('minor bug')
            }
        }

        // insert result
        concordances.push(tmpConcordanceArray);
    });

    // return
    return concordances;
}

