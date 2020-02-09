const fs = require('fs');
const path = require('path');
// const RedisSMQ = require("rsmq");

const RSMQueue = require("../modules/redisClient");

var exec = require('child_process').exec;

var express = require('express');
var router = express.Router();




var imgQueue = new RSMQueue('realSense');
var rectQueue = new RSMQueue('faceTarget');
var rawQueue = new RSMQueue('rawRect');
var testQueue=new RSMQueue('voice_order');


const FACE_MJPEG = path.join(__dirname, '../public/resource/face.jpg');


const FACE_TIMEOUT = 2*60;  // 2min


var faceTO = false;
const now = function () {
    return Math.floor(new Date().getTime() / 1000);
};



/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendfile('public/drinks.html');
});



router.get('/api/face.json', function (req, res, netxt) {
    res.sendfile('public/resource/face.json');
});


var faceImg = fs.readFileSync(FACE_MJPEG);
const setfaceImg = function(message) {
    faceImg = message;
};
imgQueue.subscribe(setfaceImg, 10);

router.get('/face.mjpg', function (req, res, netxt) {
    const IMG = FACE_MJPEG;
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Pragma': 'no-cache'
    });

    var stop = false;


    const send_next = function (data) {
        if (stop) return;

        // data = faceImg;
        if (!data) {
            console.log(typeof data, data)
        }

        if (typeof data === 'string')
            data = Buffer.from(data, 'base64')

        res.write("--myboundary\r\n");
        res.write("Content-Type: image/jpeg\r\n");
        res.write("Content-Length: " + data.length + "\r\n");
        res.write("\r\n");
        res.write(data, 'binary');
        res.write("\r\n");
    };

    send_next(fs.readFileSync(IMG));



    const sendImg = setInterval(function () {
        if (stop) clearInterval(sendImg);
        send_next(faceImg);
    }, 100)

    res.connection.on('close', function () {
        stop = true;
    });
});


var rectTO = false;
var face_rect_ts = Date.now();
var face_rect = {'to': false};
face_rect.location=[];
face_rect.location.push("80%");
face_rect.location.push("80%");
face_rect.location.push("5%");
face_rect.location.push("10%");
const set_rect = function (message) {
    // console.log(message)
    if (message) {
        face_rect = JSON.parse(message);
        face_rect_ts = Date.now();
        face_rect['to'] = false;
        console.log(3333, face_rect)
    } else {

    }
};
rectQueue.subscribe(set_rect, 10);

router.get('/api/face_rect.json', function (req, res, netxt) {

    if ( Date.now() - face_rect_ts > 1000) {
        face_rect['to'] = true;
    }
    res.send(face_rect)

});


var raw_rect = {};
const set_raw_rect = function (message) {
    // console.log(message)
    if (message) {
        raw_rect = JSON.parse(message);
        console.log(3333, raw_rect)
        // face_rect_ts = Date.now();
        // raw_rect['to'] = false;
    } else {

    }
};
rawQueue.subscribe(set_raw_rect, 10);
router.get('/api/raw_rect.json', function (req, res, netxt) {

    res.send(raw_rect)

});
var speech_data={};
const set_speech_data=function(message){
	if (message) {
        speech_data = JSON.parse(message);
        console.log(3333, speech_data)
        // face_rect_ts = Date.now();
        // raw_rect['to'] = false;
    } else {

    }
}
testQueue.subscribe(set_speech_data, 10);
/*var flag=0;
var data0={};
data0.pageStatus="idle"
data0.name="unknown"
data0.gender="unknown"
data0.age="0"
data0.speechRecoResult=""
data0.OrderInfo={}
data0.OrderInfo.DrinkName=""
data0.OrderInfo.CupNum=""
data0.OrderInfo.CupType=""
data0.OrderInfo.Temp=""
data0.OrderInfo.OrderFinish=""
var data1={};
data1.pageStatus="working"
data1.name="甘坤"
data1.gender="male"
data1.age="23"
data1.speechRecoResult="我要一杯卡布奇诺"
data1.OrderInfo={}
data1.OrderInfo.DrinkName=""
data1.OrderInfo.CupNum=""
data1.OrderInfo.CupType=""
data1.OrderInfo.Temp=""
data1.OrderInfo.OrderFinish="false"
var data11={};
data11.pageStatus="working"
data11.name="甘坤"
data11.gender="male"
data11.age="23"
data11.speechRecoResult="热的"
data11.OrderInfo={}
data11.OrderInfo.DrinkName=""
data11.OrderInfo.CupNum=""
data11.OrderInfo.CupType=""
data11.OrderInfo.Temp=""
data11.OrderInfo.OrderFinish="false"
var data2={};
data2.pageStatus="orderInfo"
data2.name="甘坤"
data2.gender="male"
data2.age="23"
data2.speechRecoResult="ok"
data2.OrderInfo={}
data2.OrderInfo.DrinkName="卡布奇诺"
data2.OrderInfo.CupNum="1"
data2.OrderInfo.CupType="0"
data2.OrderInfo.Temp="1"
data2.OrderInfo.OrderFinish="false"
var data3={};
data3.pageStatus="orderInfo"
data3.name="甘坤"
data3.gender="male"
data3.age="23"
data3.speechRecoResult=""
data3.OrderInfo={}
data3.OrderInfo.DrinkName="卡布奇诺"
data3.OrderInfo.CupNum="1"
data3.OrderInfo.CupType="0"
data3.OrderInfo.Temp="1"
data3.OrderInfo.OrderFinish="true"*/
router.get('/api/speechData', function (req, res, netxt) {
    /*flag=(flag+1);
    if(flag==5)
        flag=0;
    switch(flag)
    {
        case 0:speech_data=data0;break;
        case 1:speech_data=data1;break;
        case 2:speech_data=data11;break;
        case 3:speech_data=data2;break;
        case 4:speech_data=data3;
    }*/
    res.send(speech_data)
});
module.exports = router;
