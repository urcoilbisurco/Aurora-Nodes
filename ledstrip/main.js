print(process.memory());

const env= require("./shared/_env.js");
import conn from "./shared/conn.js";
import blink from "./shared/blink.js";

function main() {
  conn(function(topic){
    blink(5);
    console.log("CONNECTED", topic);
    const mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
        console.log('Connected to mqtt!', topic+"/update");
        mqtt.subscribe(topic+"/update");
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(12, JSON.parse(m).open)
    })
    mqtt.on("end", ()=>{
      console.log("server disconnected. TODO Retry!")
    })
    mqtt.connect()
  })
}
