print(process.memory());

const env= require("./shared/_env.js");
import conn from "./shared/conn.js";
//import blink from "./shared/blink.js";
var esp8266 = require("ESP8266");
pinMode(D2, "output");
var pins=100;


function main() {
  conn(function(topic){
    //conn=null;
    //blink(5);
    console.log("CONNECTED", topic);
    const mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
        console.log('Connected to mqtt!', topic+"/update");
        mqtt.subscribe(topic+"/update");
        print(process.memory());
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(12, !JSON.parse(m).open)
      if(JSON.parse(m).open){
        print(process.memory());
        colorLeds(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
        print(process.memory());
      }
    })
    mqtt.on("end", ()=>{
      console.log("server disconnected. TODO Retry!")
    })
    mqtt.connect()
  })
}
//
// function main(){
//   setInterval(function() {
//     console.log("Changing ...");
//     colorLeds(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
//   }, 1000);
// }


function colorLeds(red, green, blue) {
  var data = [];
  for (var i=0; i<pins; i++) {
    data.push(green);
    data.push(red);
    data.push(blue);
  }
  esp8266.neopixelWrite(NodeMCU.D2, data);
}
