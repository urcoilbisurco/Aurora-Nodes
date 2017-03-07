
## Aurora Things
Espruino code for JS-devices connected with Aurora-Server

## Setup
You need to have an ESP8266 microcontroller.
Flash it with https://github.com/thingsSDK/flasher.js
Then follow the instruction on this page for setup the client:
https://github.com/thingsSDK/thingssdk-cli

## Installation

create an "_env.js" file with inside:

```javascript
var env={
  mqtt_server:"your mtqq server"
  name: "Name of Wifi",
  password: "Wifi password",
  mqtt:{
    ip:"IP of mqtt broker",
    options:{//optionals
      username:""
      password:"",
      port:""
    }
  }
}
module.exports=env;
```

Then run

```
  npm install
  npm run dev
```
