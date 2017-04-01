
const wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();

let parseRequestData = function(str){
  return str.split("&").reduce(function(prev, curr, i, arr) {
    var p = curr.split("=");
    prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    return prev;
  }, {});
}
let handleRequest=function(req, res) {
  //console.log("connected...");
  print(process.memory());
  if (req.method=="POST") {
    obj=parseRequestData(req.read())
    //console.log("start wifi...", obj)
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<html><div><h1>Thank you.</h1><h2>You can now close this page and restore your Wi-Fi connection.</h2></div></html>`);
    setTimeout(function(){
      wifi.stopAP();
      start_wifi_and_register(obj.s, obj.p, obj.c);
      digitalWrite(13, false)
    }, 3000)
  }else{
    wifi.scan(function(ns){
      print(process.memory());
      var out=`<html><style>body{font-size:19px;padding:64px 32px;}</style><body>`
      out = out+`<form method="POST" action="/"><label for="s">Choose Wifi</label><br/><select name="s" id="s">`
      out=out+ns.map(function(n) {
        return '<option value="'+n.ssid+'">'+n.ssid+'</option>';
      });
      print(process.memory());
      out=out+`</select><br/><label for="p">Password</label><br/><input id="p" name="p" type="password"/><br/><label for="c">Node Code</label><br/><input id="c" name="c" type="text"/><br/><input type="submit" value="save"></form>`;
      out=out+"</body></html>"
      //console.log("connected...");
      print(process.memory());
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(out);
    });
  }
}

//start AP and web server
let onWifiError=function(){
  //console.log("ERROR wifi")
  print(process.memory());
  wifi.setHostname("aurora")
  wifi.startAP("aurora", {}, function(err){
    if(err) {
        //console.log("An error has occured :( ", err.message);
    } else {
      require("http").createServer(handleRequest).listen(80);
      digitalWrite(13, false)
      console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
      print(process.memory());
    }
  })
}
let check_wifi=function(){
  var timer=setInterval(function(){
    wifi.getDetails(function(obj){
      //console.log(obj.status)
      if(obj.status=="no_ap_found" || obj.status=="wrong_password" || obj.status=="off" || obj.status=="connect_failed"){
        //console.log("error, creating access point...")
        onWifiError()
        clearInterval(timer);
      }
      if(obj.status=="connected"){
        clearInterval(timer);
      }
    })
  },1000)
}

let register_node=function(code, callback){
  var env=require("./shared/_env.js");
  require("http").get(env[0]+"/api/v1/nodes/register/"+code, function(res) {
    var c = "";
    res.on('data', function(data) {
      c += data;
      //console.log("data?", data)
      //console.log("JSON> ", JSON.parse(data));
    });
    res.on('close', function(data) {
      //console.log("?", data)
      //console.log("contents", JSON.parse(c))
      j=JSON.parse(c)
      print(process.memory());
      f.write(3, j.user+"/"+j.uuid);
      //REBOOT!
      //console.log("rebooting....")
      load()
    });
  });
}
let start_wifi_and_register=function(ssid, password, code){
  check_wifi()
  wifi.connect(ssid, { password: password }, function(error) {
    if(error){
      onWifiError()
    }else{
      //console.log(`Connected to: ${ wifi.getIP().ip }`)
      f.write(0, ssid);
      f.write(1, password);
      f.write(2, code);
      register_node(code)
    }
  });
}
export default conn=function(callback){
  check_wifi()
  let ssid=E.toString(f.read(0))
  let pass=E.toString(f.read(1))
  //console.log("saved ssid:", ssid)
  //console.log("saved pass:", pass)
  if(ssid!=undefined){
    wifi.connect(ssid, { password: pass }, function(e){
      if (e){
        onWifiError(e)
      }else{
        let token=E.toString(f.read(3))
        if(token){
          //console.log("token", token)
          console.log("BEFORE")
          print(process.memory());
          console.log("after")
          //going to null all functions
          start_wifi_and_register=null;
          read=null;
          register_node=null;
          check_wifi=null;
          onWifiError=null;
          handleRequest=null;
          parseRequestData=null;
          print(process.memory());
          //require("./blink.js")(5)

          callback(token)
        }else{
          register_node(E.toString(f.read(2)))
        }
      }
   });
  }
}

let read=function(p){
  let m=f.read(p)
  if(m){
    return E.toString(m)
  }else{
    return m;
  }
}
