print(process.memory());
const conn=require("./conn.js");

function main(){
  print(process.memory());
  // f.write(0, "test");
  // f.write(1, "test");
  // f.write(3,0);
  const env= require("./_env.js")
  conn(function(topic){
    console.log("CONNECTED", topic);
    let mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
        console.log('Connected to mqtt!', topic+"/update");
        require("./blink.js")(5)
        mqtt.subscribe(topic+"/update");
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(D2, !JSON.parse(m).open)
    })
    mqtt.on("end", ()=>{
      console.log("server disconnected. TODO Retry!")
    })
    mqtt.connect()
  })
}
