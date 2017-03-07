const wifi = require('Wifi');
const env=require("./_env.js");
let mqtt = require("MQTT").create(env.mqtt.ip, env.mqtt.options);
let isOn = false;
const interval = 500; // 500 milliseconds = 0.5 seconds

/**
 * The `main` function gets executed when the board is initialized.
 * Development: npm run dev
 * Production: npm run deploy
 */
function main() {
    // setInterval(() => {
    //     isOn = !isOn; // Flips the state on or off
    //     digitalWrite(D2, isOn); // D2 is the blue LED on the ESP8266 boards
    // }, interval);

    mqtt.on('connected', () => {
        console.log('Connected to mqtt!');
        mqtt.subscribe("58bd27936b4f3a89b6d86abf/led/update");
    });
    mqtt.on("message", (topic, message) => {
      console.log("message received");
      console.log("topic", topic);
      console.log("message", message);
      digitalWrite(D2, !JSON.parse(message).open)
    })

    wifi.connect(env.name, { password: env.password }, error => {
      if (error) console.error(error)
      else console.log(`Connected to: ${ wifi.getIP().ip }`)
      mqtt.connect()
    });
}
