'use strict';

var wifi = require('Wifi');
var env = require("./_env.js");
var mqtt = require("MQTT").create(env.mqtt.ip, env.mqtt.options);
function main() {
  mqtt.on('connected', function () {
    console.log('Connected to mqtt!');
    mqtt.subscribe("58bd27936b4f3a89b6d86abf/led/update");
  });
  mqtt.on("message", function (topic, message) {
    console.log("message received");
    console.log("topic", topic);
    console.log("message", message);
    digitalWrite(D2, !JSON.parse(message).open);
  });
  wifi.connect(env.name, { password: env.password }, function (error) {
    if (error) console.error(error);else console.log("Connected to: " + wifi.getIP().ip);
    mqtt.connect();
  });
}
main();
