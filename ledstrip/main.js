const env= require("./shared/_env.js");
var esp8266 = require("ESP8266");
pinMode(D2, "output");
var leds=100;

function main() {
  //colorLeds(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
  ping(0,255,0,0)
}

function ping(led, red,green,blue){
  var data=[];
  for (var i=0; i<leds; i++) {
    if(i==led){
      data.push(green);
      data.push(red);
      data.push(blue);
    }else{
      data.push(0);
      data.push(0);
      data.push(0);
    }
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  if(led<leds){
    setTimeout(()=>{
      ping(led+1, red,green,blue)
    },1000)
  }
}

function colorLeds(red, green, blue) {
  var data = [];
  for (var i=0; i<leds; i++) {
    data.push(green);
    data.push(red);
    data.push(blue);
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
}
