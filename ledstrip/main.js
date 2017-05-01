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
  neopixel.init(100, NodeMCU.D2);
  neopixel.bar(colors);

  //pulse(colors);
}

let neopixel={
  leds:0,
  init:(leds, pin, time=1)=>{
    this.leds=leds;
    this.pin=pin;
    this.time=time;
  },
  bar: (colors, led=0, dir=1)=>{
    let data=[];
    for (var i=0; i<this.leds; i++) {
      if(i<led){
        data.push(...colors)
      }else{
        data.push(...[0,0,0]);
      }
    }
    this.show(data);
    data=null;
    let led2=led+dir;
    setTimeout(()=>{
      if((dir==1 & led<this.leds) | (dir==-1 & led>0)){
        this.bar(led2, colors, dir)
      }else{
        this.bar(led2+(dir*-1), colors, dir*-1)
      }
    },this.time)
  },
  show:(data)=>{
    esp8266.neopixelWrite(this.pin, data);
  },
  ping:(colors, led=0, dir=1)=>{
    let data=[];
    for (var i=0; i<this.leds; i++) {
      if(i==led){
        data.push(...colors)
      }else{
        data.push(...[0,0,0]);
      }
    }
    this.show(data);
    data=null;
    let led2=led+dir;
    setTimeout(()=>{
      if((dir==1 & led<this.leds) | (dir==-1 & led>0)){
        ping(led2, colors, dir)
      }else{
        ping(led2+(dir*-1), colors, dir*-1)
      }
    },time)
  },
  colorLeds(colors){
    var data = [];
    for (var i=0; i<this.leds; i++) {
      data.push(...colors)
    }
    this.write(data);
  },

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
