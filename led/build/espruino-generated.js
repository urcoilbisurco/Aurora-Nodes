'use strict';

var env$1 = env = ["http://francesco.space", "45.32.159.201"];

var L$1 = L = {
  init: function init(pin) {
    L.pin = pin;
  },
  write: function write(w) {
    digitalWrite(L.pin, w);
  },
  reset: function reset() {
    if (L.i) {
      clearInterval(L.i);
      L.i = undefined;
    }
  },
  turn: function turn(s) {
    L.reset();
    L.write(!s);
  },
  blink: function blink(times) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;

    L.reset();
    L.ledOn = false;
    L.times = 0;
    L.i = setInterval(function () {
      L.write(L.ledOn);
      L.ledOn = !L.ledOn;
      L.times = L.times + 1;
      if (L.times == times * 2) {
        L.reset();
      }
    }, t);
  }
};

var TMQ = function TMQ(server, optns) {
	var opts = optns || {};
	this.svr = server;
	this.prt = opts.port || 1883;
	this.ka = opts.keep_alive || 60;
	this.usr = opts.username;
	this.pwd = opts.password;
	this.cn = false;
	_q = this;
};
var sFCC = String.fromCharCode;
function onDat(data) {
	var cmd = data.charCodeAt(0);
	if (cmd >> 4 === 3) {
		var var_len = data.charCodeAt(2) << 8 | data.charCodeAt(3);
		var msg = {
			topic: data.substr(4, var_len),
			message: data.substr(6 + var_len, data.charCodeAt(1) - var_len)
		};
		_q.emit('message', msg);
	}
}
function mqStr(str) {
	return sFCC(str.length >> 8, str.length & 255) + str;
}
function mqPkt(cmd, variable, payload) {
	return sFCC(cmd, variable.length + payload.length) + variable + payload;
}
function mqCon(id) {
	var flags = 0;
	var payload = mqStr(id);
	if (_q.usr && _q.pwd) {
		flags |= _q.usr ? 0x80 : 0;
		flags |= _q.usr && _q.pwd ? 0x40 : 0;
		payload += mqStr(_q.usr) + mqStr(_q.pwd);
	}
	flags = sFCC(parseInt(flags.toString(16), 16));
	return mqPkt(16, mqStr("MQTT") /*protocol name*/ + "\x04" /*protocol level*/ + flags /*flags*/ + "\xFF\xFF" /*Keepalive*/, payload);
}
TMQ.prototype.connect = function () {
	var onConnected = function onConnected() {
		clearInterval(con);
		_q.cl.write(mqCon(getSerial()));
		_q.emit("connected");
		_q.cn = true;
		setInterval(function () {
			if (_q.cn) _q.cl.write(sFCC(12 << 4) + "\x00");
		}, _q.ka << 10);
		_q.cl.on('data', onDat.bind(_q));
		_q.cl.on('end', function () {
			if (_q.cn) _q.emit("disconnected");
			_q.cn = false;
			delete _q.cl;
		});
		_q.removeAllListeners("connected");
	};
	if (!_q.cn) {
		var con = setInterval(function () {
			if (_q.cl) {
				_q.cl.end();
				delete _q.cl;
			}
			_q.cl = require("net").connect({ host: _q.svr, port: _q.prt }, onConnected);
		}, 2000);
	}
};
TMQ.prototype.subscribe = function (topic) {
	_q.cl.write(mqPkt(8 << 4 | 2, sFCC(1 << 8, 1 & 255), mqStr(topic) + sFCC(1)));
};
TMQ.prototype.publish = function (topic, data) {
	if (_q.cn) {
		_q.cl.write(mqPkt(49, mqStr(topic), data));
		_q.emit("published");
	}
};
TMQ.prototype.disconnect = function () {
	_q.cl.write(sFCC(14 << 4) + "\x00");
};
var _mqtt = mqtt = function mqtt(svr, opts) {
	return new TMQ(svr, opts);
};

var wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
var C$1 = C = {
  handleRequest: function handleRequest(req, res) {
    if (req.method == "POST") {
      req.on("close", function () {
        obj = C.parse(req.read());
        if (obj.s) {
          setTimeout(function () {
            wifi.stopAP();
            C.start_wifi_and_register(obj.s, obj.p, obj.c);
            C.L.turn(false);
          }, 3000);
        }
      });
      res.writeHead(200);
      res.end("<html><h2>You can now close this page and restore your Wi-Fi connection.</h2></html>");
    } else {
      wifi.scan(function (ns) {
        var out = "<html><style>body *{font-size:24px;padding:8px;display:block;}</style><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><form method=\"POST\" action=\"/\"><label for=\"s\">Choose Wifi</label><br/><select name=\"s\" id=\"s\">";
        out = out + ns.map(function (n) {
          return '<option value="' + n.ssid + '">' + n.ssid + '</option>';
        });
        out = out + "</select><label>Password</label><input id=\"p\" name=\"p\" type=\"text\"/><label for=\"c\">Node Code</label><input id=\"c\" name=\"c\" type=\"text\" /><input type=\"submit\" value=\"save\"></form>";
        out = out + "</html>";
        res.writeHead(200);
        res.end(out);
      });
    }
  },
  parse: function parse(s) {
    return s.split("&").reduce(function (prev, c) {
      var p = c.split("=");
      prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      return prev;
    }, {});
  },
  start_setup: function start_setup() {
    C.reboot = false;
    print(process.memory());
    wifi.setHostname("aurora");
    wifi.startAP("aurora", {}, function (err) {
      require("http").createServer(C.handleRequest).listen(80);
      C.L.turn(true);
      print(process.memory());
    });
  },
  check_wifi: function check_wifi() {
    var ct = setInterval(function () {
      wifi.getDetails(function (obj) {
        console.log(obj.status);
        print(process.memory());
        if (obj.status == "no_ap_found" || obj.status == "wrong_password" || obj.status == "off" || obj.status == "connect_failed") {
          C.error();
          clearInterval(ct);
        }
        if (obj.status == "connected") {
          clearInterval(ct);
        }
      });
    }, 1000);
  },
  error: function error() {
    console.log("ERROR");
    if (C.pin) {
      C.reboot = true;
      print(process.memory());
      C.L.blink(2, 1500);
      setTimeout(function () {
        if (C.reboot) {
          load();
        }
      }, 10000);
    } else {
      C.start_setup();
    }
  },
  register_node: function register_node(code) {
    require("http").get(env[0] + "/api/v1/nodes/register/" + code, function (res) {
      var c = "";
      res.on('data', function (data) {
        return c += data;
      });
      res.on('close', function (data) {
        j = JSON.parse(c);
        print(process.memory());
        f.write(3, j.user + "/" + j.uuid);
        load();
      });
    });
  },
  start_wifi_and_register: function start_wifi_and_register(ssid, password, code) {
    C.check_wifi();
    wifi.connect(ssid, { password: password }, function (error) {
      if (error) {
        C.error();
      } else {
        console.log("Connected to: " + wifi.getIP().ip);
        f.erase();
        f.write(0, ssid);
        f.write(1, password);
        f.write(2, code);
        C.register_node(code);
      }
      C.L.blink(5);
    });
  },
  read: function read(pos) {
    var p = f.read(pos);
    return p != undefined ? E.toString(p) : undefined;
  },
  init: function init(url, l, cb) {
    C.url = url;
    C.check_wifi();
    C.L = l;
    var ssid = C.read(0);
    var pass = C.read(1);
    console.log("saved ssid:", ssid);
    console.log("saved pass:", pass);
    if (ssid != undefined) {
      wifi.connect(ssid, { password: pass }, function (e) {
        if (e) {
          C.error();
        } else {
          var token = C.read(3);
          if (token) {
            console.log("after");
            print(process.memory());
            cb(token);
          } else {
            C.register_node(C.read(2));
          }
        }
      });
      wifi.on("disconnected", C.error);
    }
  },
  setupPin: function setupPin(pin) {
    C.pin = pin;
    pinMode(pin, 'input_pullup');
    setWatch(C.start_setup, C.pin, { repeat: true, edge: 'falling', debounce: 50 });
  }
};

L$1.init(D2);
var main = function main() {
  C$1.init(env$1[0], L$1, function (topic) {
    console.log("CONNECTED", topic);
    var mqtt = _mqtt(env$1[1], { options: { port: env$1[2] } });
    mqtt.on('connected', function () {
      console.log('Connected', topic + "/update");
      mqtt.subscribe(topic + "/update");
      L$1.blink(5);
    });
    mqtt.on("message", function (m) {
      d = JSON.parse(m.message);
      L$1.turn(d.open);
    });
    mqtt.on("disconnected", C$1.error);
    mqtt.connect();
  });
};main();
