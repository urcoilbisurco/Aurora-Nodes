import env from  "./_env.js";
import L from "./utils/led.js";
import _mqtt from "./utils/mqtt.js";
import C from "./utils/conn.js";

//NodeMCU internal LED: D2
L.init(D2);
pinMode(D5, 'input_pullup'); // Set the pinMode explicitly

const main = ()=>{
  //setup Button for start AP
  //C.setupPin(0);
  C.init(env[0], L, topic =>{
    console.log("CONNECTED", topic);
    let mqtt = _mqtt(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
      console.log('Connected', topic+"/update");
      //mqtt.subscribe(topic+"/update");
      setWatch(event =>
        console.log(`button pushed: ${ JSON.stringify(event) }`)
      , D5, { repeat: true, edge: 'falling', debounce: 50 });
    });
    mqtt.on("message", (m) => {
      d=JSON.parse(m.message)
      L.turn(d.open)
    })
    mqtt.on("disconnected", C.error)
    mqtt.connect()
  })
}
