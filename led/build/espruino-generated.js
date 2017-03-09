'use strict';

var wifi = require('Wifi');
var http = require("http");
var f = new (require("FlashEEPROM"))();
var env = require("./_env.js");
var mqtt = require("MQTT").create(env.mqtt.ip, env.mqtt.options);
function html_tmpl() {
  var out = "\n    <html>\n    <head>\n      <style>\n        body{\n          background: #f4f4f4;\n          font-family: \"Helvetica Neue\";\n          color: #666;\n          max-width: 350px;\n          margin: 0 auto;\n          padding: 64px 0 0 0;\n        }\n        form{\n          display: flex;\n          flex-direction: column;\n        }\n        label{\n          font-size: 19px;\n          margin-top: 16px 0 8px 0;\n        }\n        select{\n          color: #666;\n        }\n        input, select{\n          border-radius: 5px;\n          background: white;\n          border: 0;\n          height: 48px;\n          font-size: 16px;\n          padding-left:8px;\n        }\n        input[type=\"submit\"]{\n          background: #3f51b5;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          margin: 16px 0 0 auto;\n        }\n      </style>\n      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    </head>\n    <body>\n      {{body}}\n    </body>\n  ";
  return out;
}
function generateThanksPage() {
  var page = "\n      <div>\n        <h1>Thank you.</h1>\n        <h2>You can now close this page and restore your Wi-Fi connection.</h2>\n      </div>\n  ";
  var out = html_tmpl();
  return out.replace("{{body}}", page);
}
function generateHomePage(networks) {
  var networks_html = networks.map(function (network) {
    return '<option value="' + network.ssid + '">' + network.ssid + '</option>';
  });
  var out = html_tmpl();
  var page = "\n    <form method=\"POST\" action=\"/\">\n      <label for=\"s\">Choose Wifi</label>\n      <select name=\"s\" id=\"s\">\n        {{networks_code}}\n      </select>\n      <label for=\"p\">Password</label>\n      <input id=\"p\" name=\"p\" type=\"password\" placeholder=\"Password\"/>\n      <input type=\"submit\">\n    </form>\n  ";
  page = page.replace("{{networks_code}}", networks_html.join(""));
  return out.replace("{{body}}", page);
}
function parseRequestData(string) {
  var obj = string.split("&").reduce(function (prev, curr, i, arr) {
    var p = curr.split("=");
    prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    return prev;
  }, {});
  return obj;
}
function handleRequest(req, res) {
  console.log("connected...");
  if (req.method == "POST") {
    obj = parseRequestData(req.read());
    console.log("start wifi...", obj);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateThanksPage());
    setTimeout(function () {
      wifi.stopAP();
      start_wifi(obj.s, obj.p);
      digitalWrite(D2, false);
    }, 3000);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    wifi.scan(function (networks) {
      res.end(generateHomePage(networks));
    });
  }
}
function onWifiError() {
  digitalWrite(D2, false);
  console.log("ERROR wifi");
  wifi.setHostname("aurora");
  wifi.startAP("aurora-node", {}, function (err) {
    if (err) {
      console.log("An error has occured :( ", err.message);
    } else {
      http.createServer(handleRequest).listen(80);
      console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
    }
  });
}
function check_wifi() {
  var connect_timeout = setInterval(function () {
    wifi.getDetails(function (obj) {
      console.log(obj.status);
      if (obj.status == "no_ap_found" || obj.status == "wrong_password" || obj.status == "off" || obj.status == "connect_failed") {
        console.log("error, creating access point...");
        onWifiError();
        clearInterval(connect_timeout);
      }
      if (obj.status == "connected") {
        clearInterval(connect_timeout);
      }
    });
  }, 1000);
}
function blink(times) {
  var ledOn = false;
  var i = 0;
  message_interval = setInterval(function () {
    digitalWrite(D2, ledOn);
    ledOn = !ledOn;
    i = i + 1;
    if (i == times * 2) {
      clearInterval(message_interval);
    }
  }, 300);
}
function start_wifi(ssid, password) {
  check_wifi();
  wifi.connect(ssid, { password: password }, function (error) {
    if (error) {
      onWifiError();
    } else {
      console.log("Connected to: " + wifi.getIP().ip);
      f.write(0, ssid);
      f.write(1, password);
    }
    blink(5);
  });
}
function main() {
  check_wifi();
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
  ssid = E.toString(f.read(0));
  pass = E.toString(f.read(1));
  console.log("ssid saved", ssid);
  console.log("pass saved", pass);
  if (ssid != undefined) {
    wifi.connect(ssid, { password: pass }, function (error) {
      if (error) {
        onWifiError(error);
      } else {
        console.log("Connected to: " + wifi.getIP().ip);
        mqtt.connect();
      }
    });
  }
}
main();
