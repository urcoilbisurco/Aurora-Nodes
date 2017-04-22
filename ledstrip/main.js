const env= require("./shared/_env.js");
var esp8266 = require("ESP8266");
pinMode(D2, "output");
var leds=2;
//GRB

function main() {
  //colorLeds(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
  setTimeout(()=>{
    console.log("1 second")
  },1000)
  let colors=[0,0,0];
  reverse_pulse(colors, 255, 0, -5);
}

function reverse_pulse(colors, start,end,step){
  console.log("colors", colors);
  let data=[];
  for (var j=0; j<leds; j++) {
    data.push(...colors)
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  if(start>end){
    setTimeout(()=>{
      colors=[start,start,start]//, colors[1]+1, colors[2]+1];
      pulse(colors,start-step, end, step)
    },1)
  }
}
function pulse(colors, start, end, step){
  console.log("colors", colors);
  let data=[];
  for (var j=0; j<leds; j++) {
    data.push(...colors)
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  if(start<end){
    setTimeout(()=>{
      colors=[start,start,start]//, colors[1]+1, colors[2]+1];
      pulse(colors,start-step, end, step)
    },1)
  }
}

function ping(led, colors){
  console.log("led", led);
  print(process.memory());
  let data=[];
  for (var i=0; i<leds; i++) {
    if(i==led){
      data.push(...colors)
    }else{
      data.push(...[0,0,0]);
    }
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  data=null;
  let led2=led+1;
  if(led<leds){
  setTimeout(()=>{
      ping(led2, colors)
  },1)
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
