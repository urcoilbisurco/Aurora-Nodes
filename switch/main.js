import env from  "./_env.js";
const wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
import L from "./led.js";
import _mqtt from "./tinyMQTT.js";
import C from "./conn.js";

//IO for Sonoff Itead
// 13 : led
// 0 : Button
// 12 : Relay
L.init(13);

const main = ()=>{
  //setup Button for start AP
  C.setupPin(0);
  C.init( topic =>{
    console.log("CONNECTED", topic);
    let mqtt = _mqtt(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
      console.log('Connected', topic+"/update");
      mqtt.subscribe(topic+"/update");
      L.blink(5)
    });
    mqtt.on("message", (m) => {
      d=JSON.parse(m.message)
      digitalWrite(12, d.open)
      L.turn(d.open)
    })
    mqtt.on("disconnected", C.error)
    mqtt.connect()
  })
}
