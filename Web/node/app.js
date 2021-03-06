var express = require('express');
var path = require('path');
var app = express();
var fs = require('fs');
var proj4 = require('proj4');
var Converter = require("csvtojson").Converter;
var converter = new Converter({ delimiter: ["."] }, { delimiter: ["."] });
var csvArray = [];

app.use(express.static(__dirname + '/../php/img'));
app.listen(8080, function () {
    console.log("CHASS Service listening on port 8080");
});

app.get('/image', function (req, res) {
    var filepath = path.resolve(__dirname + "/../php/img/" + req.query.taxonId + "_" + req.query.image + ".jpg");
    res.sendFile(filepath);
});

app.get('/imageDirectory', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const folder = path.resolve(__dirname + "/../php/img/");

    fs.readdir(folder, (err, files) => {
        res.send(files);
    })
});

app.get('/filter', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var filepath = path.resolve('../filter.html');
    res.sendFile(filepath);
});

app.get('/csv', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var inputFile = path.resolve(__dirname + '/kiruna_csv.csv');
    var filen = path.resolve(__dirname + '/test.csv');
    var test = {};
    var koordinater = [];
    var converter = new Converter({});
    converter.fromFile(inputFile, function (err, result) {
        koordinater.push({ a: "ej", b: "sadas" });
        res.send(result);
    });
});

function asyncFunc(result) {
    csvArray.push(result);
    console.log(csvArray);
}

app.get('/convert', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var X = req.query.X;
    var Y = req.query.Y;
    var t = convertToWGS84(X, Y);
    res.send(t);
});


app.get('/testdata', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var file = require("../js/testdata.js");

    //console.log(file.Testdata[1].Kännetecken.Artfakta);    
    res.send(file.Testdata);

});

app.get('/data', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var file = require("../js/data.json");
    res.json(file.Data);

});

app.get("/update", function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", '*');
    fs.readFile('../js/data.json', function (err, data) {
        data = JSON.parse(data);
        var output = "";
        for (var i = 0; i < data.Data.length; i++) {
            output = output + "<br/><br/>" + data.Data[i].Kännetecken.Artfakta;
            data.Data[i].Tags = parseTags(data.Data[i].Kännetecken.Artfakta);
        }
        var fileAsString = JSON.stringify(data);
        fs.writeFile('../js/data.json', fileAsString, 'utf8', function (err, obj) { console.dir(obj) });
        res.send("Data file updated with tags!");
    });
});

app.get("/parsetxt", function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", '*');
    fs.readFile('../artfakta.txt', 'utf8', function (err, data) {
        if (err) throw err;
        var r = Object.assign({}, data.split('\r\n'));
        r2 = r;
        var descriptions = { Data: [] };
        for (i = 1; i < Object.keys(r).length; i++) {
            r2['' + i + ''].data = r['' + i + ''].split(';');
            descriptions.Data.push(
                {
                    TaxonID: r2[i].split(';')[0],
                    NAMN: r2[i].split(';')[2],
                    LATIN: r2[i].split(';')[3],
                    Kännetecken: { Artfakta: r2[i].split(';')[1] },
                    Tags: {
                        Färg: [],
                        Längd: []
                    },
                    Coordinates: { lat: getRandomInRange(59, 59.5, 6), long: getRandomInRange(17.5, 18.5, 6) }
                }
            );
        }
        for (j = 0; j < descriptions.Data.length - 1; j++) {
            descriptions.Data[j].Tags.Färg = findColors(descriptions.Data[j].Kännetecken.Artfakta);
            descriptions.Data[j].Tags.Längd = findLengths(descriptions.Data[j].Kännetecken.Artfakta);
        }
        fs.writeFile('../js/micke.json', JSON.stringify(descriptions), 'utf8', function (err, obj) { });
        res.send(descriptions);
    });
});

function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}

function convertToWGS84(X, Y) {
    proj4.defs([
        ['WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"],
        ['RT90', "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +units=m +no_defs"]
    ]);

    //var source='WGS84';
    //var target='SWEREF99TM';

    var source = 'RT90';
    var target = 'WGS84';
    var result = proj4(source, target, [X, Y]);
    return result;
}

function parseTags(s) {
    Tags = {};
    var colors = findColors(s);
    Tags.Färg = colors;
    var lengths = findLengths(s);
    Tags.Längd = lengths;
    return Tags;
}

function parseText(s) {
    TextParametrar = {};

    var colors = findColors(s);
    var lengths = findLengths(s);
    console.log("resultat", lengths);

    TextParametrar.colors = colors;
    TextParametrar.lengths = lengths;
    console.log("Colors", TextParametrar.colors);
    return TextParametrar.colors;

}

function findColors(s) {
    listofcolors = [
        { color: "röd", hex: "#ff0000" },
        { color: "svart", hex: "#000" },
        { color: "blå", hex: "#0000ff" },
        { color: "grön", hex: "#00ff00" },
        { color: "gul", hex: "#ffff00" },
        { color: "vit", hex: "#fff" },
        { color: "grå", hex: "#cccccc" },
        { color: "orange", hex: "#ffa500" },
        { color: "brun", hex: "#964b00" }
    ];
    resultcolors = [];
    for (i = 0; i < listofcolors.length; i++) {
        if (s.indexOf(listofcolors[i].color) >= 0) {
            var colorPos = s.indexOf(listofcolors[i].color);
            var colorString = s.substr(colorPos);
            var colorWord = colorString.substr(0, colorString.indexOf(' '));
            var color = listofcolors[i];
            resultcolors.push(color);
        }
    }
    return resultcolors;
}

function findLengths(s) {
    listofmeasurements = [
        { measure: " mm ", measureText: "mm" },  //MeasureText för att inte få med "mm," t.ex.
        { measure: " cm ", measureText: "cm" },
        { measure: " dm ", measureText: "dm" },
        { measure: " m ", measureText: "m" },
        { measure: " mm, ", measureText: "mm" },
        { measure: " cm, ", measureText: "cm" },
        { measure: " dm, ", measureText: "dm" },
        { measure: " m, ", measureText: "m" }
    ];
    resultmeasurements = [];
    for (i = 0; i < listofmeasurements.length; i++) {
        if (s.indexOf(listofmeasurements[i].measure) > 0) {
            var measurePos = s.indexOf(listofmeasurements[i].measure);
            var measureString = s.substr(measurePos);
            var measureStringBefore = s.substr(measurePos - 5);   //Magiskt nummer 5... backar vi 5 steg från mm "brukar" det vara t.ex. "12-20 "
            var measureWord = measureString.substr(0, measureString.indexOf(' '));
            var measureValue = measureStringBefore.replace(/[^0-9\,\¤\–-]/g, ''); //tar bort alla icke-numeriska tecken förutom varianter av "-".
            var regex = /(\d+)/g;
            var resultList = measureStringBefore.match(regex);
            var measure = listofmeasurements[i];
            console.log(measureValue);
            resultmeasurements.push({ measure: measure.measureText, value: measureValue, measureAndValue: measureValue + " " + measure.measureText, valueList: resultList });
        }
    }
    console.log("resultmeasurement", resultmeasurements);
    return resultmeasurements;
}