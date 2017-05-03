let esp8266 = require("ESP8266");
pinMode(D2, "output");
let leds=100;
let max=5;
let step=1;
let time=100;


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
  //N.init(100, NodeMCU.D2);
  //N.bar(colors);

  pulse(colors);
}

let N={
  leds:0,
  init:(leds, pin, time=1)=>{
    N.leds=leds;
    N.pin=pin;
    N.time=time;
  },
  bar: (colors, led=0, dir=1)=>{
    console.log("COLORS", colors);
    let data=new Uint8Array(N.leds*3);
    data.fill(0);
    data.fill(colors[0], 0, led+1)
    N.show(data);
    data=null;
    let led2=led+dir;
    setTimeout(()=>{
      if((dir==1 & led<N.leds) | (dir==-1 & led>0)){
        N.bar(colors,led2, dir)
      }else{
        N.bar(colors, led2+(dir*-1), dir*-1)
      }
    },N.time)
  },
  show:(data)=>{
    esp8266.neopixelWrite(N.pin, data);
  },
  ping:(colors, led=0, dir=1)=>{
    let data=new Uint8Array(N.leds*3);
    data.fill(0);
    data.fill(colors[0], led*3, led*3+3)
    // let data=[];
    // for (var i=0; i<N.leds; i++) {
    //   if(i==led){
    //     data.push(...colors)
    //   }else{
    //     data.push(...[0,0,0]);
    //   }
    // }
    N.show(data);
    data=null;
    let led2=led+dir;
    setTimeout(()=>{
      if((dir==1 & led<N.leds) | (dir==-1 & led>0)){
        ping(led2, colors, dir)
      }else{
        ping(led2+(dir*-1), colors, dir*-1)
      }
    },time)
  },
  colorLeds(colors){
    let data=new Uint8Array(N.leds*3);
    data.fill(colors[0]);
    // var data = [];
    // for (var i=0; i<N.leds; i++) {
    //   data.push(...colors)
    // }
    N.write(data);
  },

}

function r_pulse(colors, start,end,step){
  console.log("colors", colors);
  let data=new Uint8Array(leds*3);
  data.fill(start)
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
  let data=new Uint8Array(leds*3);
  data.fill(start)
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
