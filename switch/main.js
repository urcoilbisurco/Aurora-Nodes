const env= require("./_env.js");
const wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
import L from "./led.js";
//const l=new Led(13);
//IO for Sonoff Itead
// 13 : led
// 0 : Button
// 12 : Relay

L.init(13);

const C={
  handleRequest: (req,res)=>{
    console.log("connected...");
    print(process.memory());
    if (req.method=="POST") {
      obj=parse(req.read())
      console.log("start wifi...", obj)
      res.writeHead(200);
      res.end(`<html><h2>You can now close this page and restore your Wi-Fi connection.</h2></html>`);
      setTimeout(() => {
        wifi.stopAP();
        C.start_wifi_and_register(obj.s, obj.p, obj.c);
        digitalWrite(13, false)
      }, 3000)
    }else{
      wifi.scan(ns => {
        print(process.memory());
        let out=`<html>`
        out = out+`<form method="POST" action="/"><label for="s">Choose Wifi</label><br/><select name="s" id="s">`
        out=out+ns.map(n => '<option value="'+n.ssid+'">'+n.ssid+'</option>');
        print(process.memory());
        out=out+`</select><label>Password</label><input id="p" name="p" type="text"/><label for="c">Node Code</label><input id="c" name="c" type="text" /><input type="submit" value="save"></form>`;
        console.log("connected...");
        print(process.memory());
        out=out+"</html>"
        res.writeHead(200);
        res.end(out);
      });
    }
  },
  parse:(s)=>{
    return string.split("&").reduce((prev, curr, i, arr)=> {
      var p = curr.split("=");
      prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      return prev;
    }, {});
  },
  onWifiError:()=>{
    console.log("ERROR wifi")
    C.reboot=false;
    print(process.memory());
    wifi.setHostname("aurora")
    wifi.startAP("aurora", {}, err => {
      if(err) {
          console.log("An error has occured :( ", err.message);
      } else {
        require("http").createServer(C.handleRequest).listen(80);
        L.turn(true)
        console.log("Visit http://" + wifi.getIP().ip, "in your web browser.");
        print(process.memory());
      }
    })
  },
  check_wifi:()=>{
    var connect_timeout=setInterval(()=>{
      wifi.getDetails(obj =>{
        console.log(obj.status)
        if(obj.status=="no_ap_found" || obj.status=="wrong_password" || obj.status=="off" || obj.status=="connect_failed"){
          C.onWifiError()
          clearInterval(connect_timeout);
        }
        if(obj.status=="connected"){
          clearInterval(connect_timeout);
        }
      })
    },1000)
  },
  register_node:(code)=>{
    require("http").get(env[0]+"/api/v1/nodes/register/"+code, (res)=> {
      var c = "";
      res.on('data', (data)=> c += data)
      res.on('close', (data)=> {
        j=JSON.parse(c)
        print(process.memory());
        f.write(3, j.user+"/"+j.uuid);
        //REBOOT!
        console.log("rebooting....")
        //Modules.removeCached('http')
        load()
      });
    });
  },
  error:()=>{
    C.reboot=true;
    print(process.memory());
    L.blink(5, 1000);
    //setTimeout(()=>{
      // print(process.memory());
      // if(C.reboot)
      //   console.log("rebooting...")
      //   load();
    //}, 10000)
  },
  start_wifi_and_register:(ssid, password, code)=>{
    C.check_wifi()
    wifi.connect(ssid, { password: password }, (error) => {
      if(error){
        C.error()
      }else{
        console.log(`Connected to: ${ wifi.getIP().ip }`)
        f.write(0, ssid);
        f.write(1, password);
        f.write(2, code);
        C.register_node(code)
      }
      L.blink(5)
    });
  },
  read:(pos)=>{
    let p=f.read(pos);
    return (p!=undefined ? E.toString(p) : undefined)
  },
  init:(cb)=>{
    C.check_wifi()
    let ssid=C.read(0)
    let pass=C.read(1)
    console.log("saved ssid:", ssid)
    console.log("saved pass:", pass)
    if(ssid!=undefined){
      wifi.connect(ssid, { password: pass }, (e) => {
        if (e){
          C.onWifiError(e)
        }else{
          let token=C.read(3)
          if(token){
            console.log("after")
            print(process.memory());
            cb(token)
          }else{
            C.register_node(C.read(2))
          }
        }
     });
     wifi.on("disconnected", C.error);
    }
  }
}
pinMode(0, 'input_pullup');
const onClickBtn = event => {
  console.log(`button pushed: ${ JSON.stringify(event) }`);
  print(process.memory());
  Modules.removeCached('MQTT')
  print(process.memory());
  //C.onWifiError();
}

const main = ()=>{
  setWatch(onClickBtn, 0, { repeat: true, edge: 'falling', debounce: 50 });
  print(process.memory());
  C.init( topic =>{
    print(process.memory());
    console.log("CONNECTED", topic);
    let mqtt = require("MQTT").create(env[1], {options:{port:env[2]}});
    mqtt.on('connected', () => {
      mqtt.subscribe(topic+"/update");
      console.log('Connected to mqtt!', topic+"/update");
      L.blink(5)
    });
    mqtt.on("message", (to, m) => {
      console.log("message", JSON.parse(m));
      digitalWrite(12, JSON.parse(m).open)
      digitalWrite(13, !JSON.parse(m).open)
      L.turn(JSON.parse(m).open)
    })
    mqtt.on("end", C.error)
    mqtt.connect()
    print(process.memory());
  })
}
