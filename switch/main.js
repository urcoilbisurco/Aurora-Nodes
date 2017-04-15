const env= require("./_env.js");
const wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
const b=require("./blink.js");
//IO for Sonoff Itead
// 13 : led
// 0 : Button
// 12 : Relay

var Conn = function(server, optns){
	_c = this;
};

Conn.prototype.handleRequest= (req,res)=> {
  console.log("connected...");
  print(process.memory());
  if (req.method=="POST") {
    obj=parse(req.read())
    console.log("start wifi...", obj)
    res.writeHead(200);
    res.end(`<html><div><h1>Thank you.</h1><h2>You can now close this page and restore your Wi-Fi connection.</h2></div></html>`);
    setTimeout(() => {
      wifi.stopAP();
      _c.start_wifi_and_register(obj.s, obj.p, obj.c);
      digitalWrite(13, false)
    }, 3000)
  }else{
    wifi.scan(ns => {
      print(process.memory());
      var out=`<html><style>body *{font-size:24px;padding:8px;display:block;}</style><meta name="viewport" content="width=device-width, initial-scale=1">`
      out = out+`<form method="POST" action="/"><label for="s">Choose Wifi</label><br/><select name="s" id="s">`
      out=out+ns.map(n => '<option value="'+n.ssid+'">'+n.ssid+'</option>');
      print(process.memory());
      out=out+`</select><label>Password</label><input id="p" name="p" type="text" placeholder="Password"/><label for="c">Node Code</label><input id="c" name="c" type="text" placeholder="1234"/><input type="submit" value="save"></form>`;
      console.log("connected...");
      print(process.memory());
      out=out+"</html>"
      res.writeHead(200);
      res.end(out);
    });
  }
}
Conn.prototype.parse= (s) => {
  return string.split("&").reduce((prev, curr, i, arr)=> {
    var p = curr.split("=");
    prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    return prev;
  }, {});
}
Conn.prototype.onWifiError = () => {
  console.log("ERROR wifi")
  print(process.memory());
  wifi.setHostname("aurora")
  wifi.startAP("aurora", {}, err => {
    if(err) {
        console.log("An error has occured :( ", err.message);
    } else {
      require("http").createServer(_c.handleRequest).listen(80);
      digitalWrite(13, false)
      console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
      print(process.memory());
    }
  })
}
Conn.prototype.check_wifi = ()=>{
  var connect_timeout=setInterval(()=>{
    wifi.getDetails(obj =>{
      console.log(obj.status)
      if(obj.status=="no_ap_found" || obj.status=="wrong_password" || obj.status=="off" || obj.status=="connect_failed"){
        _c.onWifiError()
        clearInterval(connect_timeout);
      }
      if(obj.status=="connected"){
        clearInterval(connect_timeout);
      }
    })
  },1000)
}
Conn.prototype.register_node = (code) => {
  var env=require("./_env.js");
  require("http").get(env[0]+"/api/v1/nodes/register/"+code, (res)=> {
    var c = "";
    res.on('data', (data)=> c += data)
    res.on('close', (data)=> {
      j=JSON.parse(c)
      print(process.memory());
      f.write(3, j.user+"/"+j.uuid);
      //REBOOT!
      console.log("rebooting....")
      load()
    });
  });
}
Conn.prototype.start_wifi_and_register = (ssid, password, code)=>{
  _c.check_wifi()
  wifi.connect(ssid, { password: password }, (error) => {
    if(error){
      _c.onWifiError()
    }else{
      console.log(`Connected to: ${ wifi.getIP().ip }`)
      f.write(0, ssid);
      f.write(1, password);
      f.write(2, code);
      _c.register_node(code)
    }
    b(5)
  });
}
Conn.prototype.read = (pos)=>{
  let p=f.read(pos);
  return (p!=undefined ? E.toString(p) : undefined)
}
Conn.prototype.init = (cb) =>{
  _c.check_wifi()
  let ssid=_c.read(0)
  let pass=_c.read(1)
  console.log("saved ssid:", ssid)
  console.log("saved pass:", pass)
  if(ssid!=undefined){
    wifi.connect(ssid, { password: pass }, (e) => {
      if (e){
        _c.onWifiError(e)
      }else{
        let token=_c.read(3)
        if(token){
          //require("./blink.js")(5)
          console.log("after")
          print(process.memory());
          cb(token)
        }else{
          _c.register_node(_c.read(2))
        }
      }
   });
  }
}

pinMode(0, 'input_pullup');
const onClickBtn = event => {
  console.log(`button pushed: ${ JSON.stringify(event) }`);
  // const isOn = digitalRead(D4)
  // digitalWrite(D4, !isOn)
  //onWifiError();
}

const main = ()=>{
  setWatch(onClickBtn, 0, { repeat: true, edge: 'falling', debounce: 50 });
  print(process.memory());
  let c=new Conn();
  print(process.memory());
  wifi.on("disconnected", (e)=>{
    b(10);
    setTimeout(()=>{
      console.log("rebooting...")
      load();
    }, 10000)
  })
  c.init( topic =>{
    print(process.memory());
    //require("./blink.js")(5)
    console.log("CONNECTED", topic);
    let mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
      mqtt.subscribe(topic+"/update");
      console.log('Connected to mqtt!', topic+"/update");
      b(5)
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(12, JSON.parse(m).open)
      digitalWrite(13, !JSON.parse(m).open)
    })
    mqtt.on("end", ()=>{
      console.log("server disconnected. TODO Retry!")
      b(10);
      setTimeout(()=>{
        console.log("rebooting...")
        load();
      }, 10000)
    })
    mqtt.connect()
    print(process.memory());
  })
}
