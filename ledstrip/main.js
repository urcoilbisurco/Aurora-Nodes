const env= require("./shared/_env.js");
let esp8266 = require("ESP8266");
pinMode(D2, "output");
let leds=100;
let max=10;
let step=1;
let time=1;


//GRB
function main() {
  //colorLeds(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
  setInterval(()=>{
    console.log("1 second")
  },1000)
  let colors=[0,30,0];


  //colorLeds(0,0,0);
  //ping(0,colors);
  //bar(0, colors);
  pulse(colors);
}
function bar(led, colors, dir=1){
  let data=[];
  for (var i=0; i<leds; i++) {
    if(i<led){
      data.push(...colors)
    }else{
      data.push(...[0,0,0]);
    }
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  data=null;
  let led2=led+dir;
  if((dir==1 & led<leds) | (dir==-1 & led>0)){
  //if(led<leds){
    setTimeout(()=>{
        bar(led2, colors, dir)
    },time)
  }else{
    setTimeout(()=>{
        bar(led2+(dir*-1), colors, dir*-1)
    },time)
  }
}

function ping(led, colors, dir=1){
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
  let led2=led+dir;
  if((dir==1 & led<leds) | (dir==-1 & led>0)){
  //if(led<leds){
    setTimeout(()=>{
        ping(led2, colors, dir)
    },time)
  }else{
    setTimeout(()=>{
        ping(led2+(dir*-1), colors, dir*-1)
    },time)
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

function r_pulse(colors, start,end,step){
  console.log("colors", colors);
  let data=[];
  for (var j=0; j<leds; j++) {
    data.push(...colors)
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  if(start>end){
    setTimeout(()=>{
      colors=[start,start,start]//, colors[1]+1, colors[2]+1];
      r_pulse(colors,start-step, end, step)
    },time)
  }else{
    f_pulse(colors, 0, max, step);
  }
}
function pulse(colors){
  start=0;
  end=max;
  f_pulse(colors, start,end,step)

}
function f_pulse(colors, start, end, step){
  console.log("colors", colors);
  let data=[];
  for (var j=0; j<leds; j++) {
    data.push(...colors)
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
  if(start<end){
    setTimeout(()=>{
      colors=[start,start,start]//, colors[1]+1, colors[2]+1];
      f_pulse(colors,start+step, end, step)
    },time)
  }else{
    r_pulse(colors, max, 0, step);
  }
}
