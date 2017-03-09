const wifi = require('Wifi');
const http = require("http");
var f = new (require("FlashEEPROM"))();
const env=require("./_env.js");
let mqtt = require("MQTT").create(env.mqtt.ip, env.mqtt.options);

function html_tmpl(){
  var out=`
    <html>
    <head>
      <style>
        body{
          background: #f4f4f4;
          font-family: "Helvetica Neue";
          color: #666;
          max-width: 350px;
          margin: 0 auto;
          padding: 64px 0 0 0;
        }
        form{
          display: flex;
          flex-direction: column;
        }
        label{
          font-size: 19px;
          margin-top: 16px 0 8px 0;
        }
        select{
          color: #666;
        }
        input, select{
          border-radius: 5px;
          background: white;
          border: 0;
          height: 48px;
          font-size: 16px;
          padding-left:8px;
        }
        input[type="submit"]{
          background: #3f51b5;
          display: flex;
          color:white;
          width:200px;
          align-items: center;
          justify-content: center;
          margin: 16px 0 0 auto;
        }
      </style>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      {{body}}
    </body>
  `;
  return out;
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
function generateHomePage(networks){
  var networks_html= networks.map(function(network) {
      return '<option value="'+network.ssid+'">'+network.ssid+'</option>';
  });
  var out=html_tmpl();
  var page = `
    <form method="POST" action="/">
      <label for="s">Choose Wifi</label>
      <select name="s" id="s">
        {{networks_code}}
      </select>
      <label for="p">Password</label>
      <input id="p" name="p" type="password" placeholder="Password"/>
      <input type="submit">
    </form>
  `;
  page=page.replace("{{networks_code}}", networks_html.join(""))
  return out.replace("{{body}}", page)
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
      start_wifi(obj.s, obj.p);
      digitalWrite(D2, false)
    }, 3000)
  }else{
    //Handles all requests
    res.writeHead(200, {'Content-Type': 'text/html'});
    //Scans for accessible networks
    wifi.scan(function(networks){
      res.end(generateHomePage(networks));
    });
  }
}

function onWifiError(){
  digitalWrite(D2, false)
  //start AP and web server
  console.log("ERROR wifi")
  wifi.setHostname("aurora")
  wifi.startAP("aurora-node", {}, function(err){
    if(err) {
        console.log("An error has occured :( ", err.message);
    } else {
      http.createServer(handleRequest).listen(80);
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
function start_wifi(ssid, password){
  check_wifi()
  wifi.connect(ssid, { password: password }, error => {
    if(error){
      onWifiError()
    }else{
      console.log(`Connected to: ${ wifi.getIP().ip }`)
      //ok, save variables
      f.write(0, ssid);
      f.write(1, password);
    }
    blink(5)
    //mqtt.connect()
  });
}

function main() {
  //onWifiError()
  check_wifi()


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

  //get variables
  ssid=E.toString(f.read(0))
  pass=E.toString(f.read(1))
  //pass=f.readMem(1)
  console.log("ssid saved", ssid)
  console.log("pass saved", pass)
  if(ssid!=undefined){
    wifi.connect(ssid, { password: pass }, error => {
   //   //onWifiError();
   //   console.log("ERROR?")
     if (error){
       onWifiError(error)
     }else{
       console.log(`Connected to: ${ wifi.getIP().ip }`)
       mqtt.connect()
     }
   });
  }
  // wifi.connect("env.name", { password: "env.password" }, error => {
  //   //onWifiError();
  //   console.log("ERROR?")
  //   if (error) onWifiError(error)
  //   else console.log(`Connected to: ${ wifi.getIP().ip }`)
  //   //mqtt.connect()
  // });

}
