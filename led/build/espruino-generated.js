'use strict';

print(process.memory());
var env = require("./_env.js");
var wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
function generateThanksPage() {
  var page = "<html>\n      <div>\n        <h1>Thank you.</h1>\n        <h2>You can now close this page and restore your Wi-Fi connection.</h2>\n      </div>\n      </html>\n  ";
  return page;
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
  print(process.memory());
  if (req.method == "POST") {
    obj = parseRequestData(req.read());
    console.log("start wifi...", obj);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateThanksPage());
    setTimeout(function () {
      wifi.stopAP();
      start_wifi_and_register(obj.s, obj.p, obj.c);
      digitalWrite(13, false);
    }, 3000);
  } else {
    wifi.scan(function (ns) {
      print(process.memory());
      var out = "<html><head><style>body{font-family:\"Helvetica\";font-size:19px;padding:64px 32px;}*{text-align:center;}</style> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head><body>";
      out = out + "<form method=\"POST\" action=\"/\"><label for=\"s\">Choose Wifi</label><br/><select name=\"s\" id=\"s\">";
      out = out + ns.map(function (n) {
        return '<option value="' + n.ssid + '">' + n.ssid + '</option>';
      });
      print(process.memory());
      out = out + "</select><br/><label for=\"p\">Password</label><br/><input id=\"p\" name=\"p\" type=\"password\" placeholder=\"Password\"/><br/><label for=\"c\">Node Code</label><br/><input id=\"c\" name=\"c\" type=\"text\" placeholder=\"1234\"/><br/><input type=\"submit\" value=\"save\"></form>";
      console.log("connected...");
      print(process.memory());
      res.writeHead(200, { 'Content-Type': 'text/html' });
      out = out + "</body></html>";
      res.end(out);
    });
  }
}
function onWifiError() {
  console.log("ERROR wifi");
  print(process.memory());
  wifi.setHostname("aurora");
  wifi.startAP("aurora", {}, function (err) {
    if (err) {
      console.log("An error has occured :( ", err.message);
    } else {
      require("http").createServer(handleRequest).listen(80);
      digitalWrite(13, false);
      console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
      print(process.memory());
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
function register_node(code, callback) {
  var env = require("./_env.js");
  require("http").get(env[0] + "/api/v1/nodes/register/" + code, function (res) {
    var c = "";
    res.on('data', function (data) {
      c += data;
      console.log("data?", data);
      console.log("JSON> ", JSON.parse(data));
    });
    res.on('close', function (data) {
      console.log("?", data);
      console.log("contents", JSON.parse(c));
      j = JSON.parse(c);
      print(process.memory());
      f.write(3, j.user + "/" + j.uuid);
      console.log("rebooting....");
      load();
    });
  });
}
function start_wifi_and_register(ssid, password, code) {
  check_wifi();
  wifi.connect(ssid, { password: password }, function (error) {
    if (error) {
      onWifiError();
    } else {
      console.log("Connected to: " + wifi.getIP().ip);
      f.write(0, ssid);
      f.write(1, password);
      f.write(2, code);
      register_node(code);
    }
    require("./blink.js")(5);
  });
}
function conn(callback) {
  check_wifi();
  var ssid = E.toString(f.read(0));
  var pass = E.toString(f.read(1));
  console.log("saved ssid:", ssid);
  console.log("saved pass:", pass);
  if (ssid != undefined) {
    wifi.connect(ssid, { password: pass }, function (e) {
      if (e) {
        onWifiError(e);
      } else {
        var token = E.toString(f.read(3));
        if (token) {
          console.log("token", token);
          callback(token);
        } else {
          register_node(E.toString(f.read(2)));
        }
      }
    });
  }
}
function main() {
  conn(function (topic) {
    console.log("CONNECTED", topic);
    var mqtt = require("MQTT").create(env[1]);
    mqtt.on('connected', function () {
      console.log('Connected to mqtt!', topic + "/update");
      require("./blink.js")(5);
      mqtt.subscribe(topic + "/update");
    });
    mqtt.on("message", function (to, m) {
      console.log("message", JSON.parse(m));
      digitalWrite(D2, !JSON.parse(m).open);
    });
    mqtt.on("end", function () {
      console.log("server disconnected. TODO Retry!");
    });
    mqtt.connect();
  });
}
E.on("init", main);save();
