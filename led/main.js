const wifi = require('Wifi');
const http = require("http");
var f = new (require("FlashEEPROM"))();
const env=require("./_env.js");
let mqtt=undefined;
function html_tmpl(){
  return out=`<html> <head>  <meta name="viewport" content="width=device-width, initial-scale=1"> </head> <body>{{body}}</body> </html>`;
}
function generateThanksPage(){
  var page = `
      <div>
        <h1>Thank you.</h1>
        <h2>You can now close this page and restore your Wi-Fi connection.</h2>
      </div>
  `;
  var out=html_tmpl();
  return out.replace("{{body}}", page);
}
function generateHomePage(ns){
  var n_h= networks.map(function(n) {
      return '<option value="'+n.ssid+'">'+n.ssid+'</option>';
  });
  ns=null;
  var p = `
    <form method="POST" action="/">
      <label for="s">Choose Wifi</label>
      <select name="s" id="s">
        {{networks_code}}
      </select>
      <label for="p">Password</label>
      <input id="p" name="p" type="password" placeholder="Password"/>
      <label for="c">Node Code</label>
      <input id="c" name="c" type="text" placeholder="1234"/>
      <input type="submit" value="save">
    </form>
  `;
  var p=p.replace("{{networks_code}}", n_h)
  n_h=null;
  return html_tmpl().replace("{{body}}", p)
}
function parseRequestData(string){
  var obj = string.split("&").reduce(function(prev, curr, i, arr) {
    var p = curr.split("=");
    prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    return prev;
  }, {});
  return obj;
}
function handleRequest(req, res) {
  console.log("connected...");
  //console.log("req", req)
  if (req.method=="POST") {
    //save wifi and password
    obj=parseRequestData(req.read())
    //.emit('data', 'Foo')
    console.log("start wifi...", obj)
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(generateThanksPage());
    setTimeout(function(){
      wifi.stopAP();
      start_wifi_and_register(obj.s, obj.p, obj.c);
      digitalWrite(D2, false)
    }, 3000)
  }else{
    //Scans for accessible networks
    wifi.scan(function(networks){
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(generateHomePage(networks));
    });
  }
}

function onWifiError(){
  //start AP and web server
  console.log("ERROR wifi")
  wifi.setHostname("aurora")
  wifi.startAP("aurora", {}, function(err){
    if(err) {
        console.log("An error has occured :( ", err.message);
    } else {
      http.createServer(handleRequest).listen(80);
      digitalWrite(D2, false)
      console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
    }
  })
}
function check_wifi(){
  var connect_timeout=setInterval(function(){
    wifi.getDetails(function(obj){
      console.log(obj.status)
      if(obj.status=="no_ap_found" || obj.status=="wrong_password" || obj.status=="off" || obj.status=="connect_failed"){
        console.log("error, creating access point...")
        onWifiError()
        clearInterval(connect_timeout);
      }
      if(obj.status=="connected"){
        clearInterval(connect_timeout);
      }
    })
  },1000)
}
function blink(times){
  var ledOn=false
  var i=0;
  message_interval=setInterval(function(){
    digitalWrite(D2, ledOn)
    ledOn=!ledOn
    i=i+1
    if(i==times*2){
      clearInterval(message_interval)
    }
  },300)
}
function register_node(code){
  console.log("registering node...")
  console.log("url:", "http://"+env.server+"/api/v1/nodes/register/"+code)
  require("http").get("http://"+env.server+"/api/v1/nodes/register/"+code, function(res) {
    var c = "";
    res.on('data', function(data) {
      c += data;
      console.log("data?", data)
      console.log("JSON> ", JSON.parse(data));
    });
    res.on('close', function(data) {
      console.log("contents", JSON.parse(c).uuid)
      j=JSON.parse(c)
      f.write(3, j.user+"/"+j._id);
    });
  });
}
function start_wifi_and_register(ssid, password, code){
  check_wifi()
  wifi.connect(ssid, { password: password }, error => {
    if(error){
      onWifiError()
    }else{
      console.log(`Connected to: ${ wifi.getIP().ip }`)
      //ok, save variables
      f.write(0, ssid);
      f.write(1, password);
      f.write(2, code);
      //send message in GET to server to register node
      register_node(code)
    }
    blink(5)
    //mqtt.connect()
  });
}
function generate_topic(){
  return E.toString(f.read(3))
  // var e=f.read(3)
  // if(e){
  //   return E.toString(e)
  // }else{
  //   console.log("topic undefined?")
  //   return undefined;
  // }
}
function main() {
  check_wifi()

  //get variables
  let ssid=E.toString(f.read(0))
  let pass=E.toString(f.read(1))
  console.log("saved ssid:", ssid)
  console.log("saved pass:", pass)
  if(ssid!=undefined){
    wifi.connect(ssid, { password: pass }, e => {
      if (e){
        onWifiError(e)
      }else{
        let t=generate_topic()
        if(t){
          mqtt = require("MQTT").create(env.mqtt.ip, env.mqtt.options);
          mqtt.on('connected', () => {
              console.log('Connected to mqtt!', t+"/update");
              mqtt.subscribe(t+"/update");
          });
          mqtt.on("message", (to, m) => {
            console.log("message", JSON.parse(m));
            digitalWrite(D2, !JSON.parse(m).open)
          })
          mqtt.on("end", ()=>{
            console.log("server disconnected. TODO Retry!")
          })
          mqtt.connect()
        }else{
          register_node(E.toString(f.read(2)))
        }
      }
   });
  }
}
