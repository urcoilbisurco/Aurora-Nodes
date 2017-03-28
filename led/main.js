print(process.memory());
const conn=require("./conn.js");
const env= require("./_env.js");

function main(){
  conn(function(topic){
    console.log("CONNECTED", topic);
    let mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.subscribe(topic+"/update");
    mqtt.on('connected', () => {
        console.log('Connected to mqtt!', topic+"/update");
        require("./blink.js")(5)
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(D2, !JSON.parse(m).open)
    })
    mqtt.on("end", ()=>{
      //TODO: reconnect
    })
    mqtt.connect()
  })
}
