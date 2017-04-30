const env= require("./_env.js");
const wifi = require('Wifi');
var f = new (require("FlashEEPROM"))();
import L from "./led.js";

const C={
  handleRequest: (req,res)=>{
    if (req.method=="POST") {
      req.on("close", function(){
        obj=C.parse(req.read())
        if(obj.s){
          setTimeout(() => {
            wifi.stopAP();
            C.start_wifi_and_register(obj.s, obj.p, obj.c);
            L.turn(false);
          }, 3000)
        }
      })
      res.writeHead(200);
      res.end(`<html><h2>You can now close this page and restore your Wi-Fi connection.</h2></html>`);
    }else{
      wifi.scan(ns => {
        let out=`<html><style>body *{font-size:24px;padding:8px;display:block;}</style><meta name="viewport" content="width=device-width, initial-scale=1"><form method="POST" action="/"><label for="s">Choose Wifi</label><br/><select name="s" id="s">`
        out=out+ns.map(n => '<option value="'+n.ssid+'">'+n.ssid+'</option>');
        out=out+`</select><label>Password</label><input id="p" name="p" type="text"/><label for="c">Node Code</label><input id="c" name="c" type="text" /><input type="submit" value="save"></form>`;
        out=out+"</html>"
        res.writeHead(200);
        res.end(out);
      });
    }
  },
  parse:(s)=>{
    return s.split("&").reduce((prev, c)=> {
      let p = c.split("=");
      prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
      return prev;
    }, {});
  },
  start_setup:()=>{
    C.reboot=false;
    print(process.memory());
    wifi.setHostname("aurora")
    wifi.startAP("aurora", {}, err => {
      require("http").createServer(C.handleRequest).listen(80);
      L.turn(true)
      print(process.memory());
    })
  },
  check_wifi:()=>{
    var ct=setInterval(()=>{
      wifi.getDetails(obj =>{
        console.log(obj.status)
        if(obj.status=="no_ap_found" || obj.status=="wrong_password" || obj.status=="off" || obj.status=="connect_failed"){
          C.error()
          clearInterval(ct);
        }
        if(obj.status=="connected"){
          clearInterval(ct);
        }
      })
    },1000)
  },

  error:()=>{
    console.log("ERROR")
    C.reboot=true;
    print(process.memory());
    L.blink(2, 1500);
    setTimeout(()=>{
      if(C.reboot){load()};
    }, 10000)
  },
  register_node: code => {
    require("http").get(env[0]+"/api/v1/nodes/register/"+code, (res)=> {
      let c = "";
      res.on('data', (data)=> c += data)
      res.on('close', (data)=> {
        j=JSON.parse(c)
        print(process.memory());
        f.write(3, j.user+"/"+j.uuid);
        load()
      });
    });
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
          C.error()
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
  },
  setupPin:(pin)=>{
    this.pin=pin;
    pinMode(pin, 'input_pullup');
    const onClickBtn = event => {
      C.start_setup();
    }
    setWatch(onClickBtn, this.pin, { repeat: true, edge: 'falling', debounce: 50 });
  }
}
