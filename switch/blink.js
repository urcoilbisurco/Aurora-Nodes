function blink(times){
  var ledOn=false
  var i=0;
  message_interval=setInterval(function(){
    digitalWrite(13, ledOn)
    ledOn=!ledOn
    i=i+1
    if(i==times*2){
      clearInterval(message_interval)
    }
  },500)
}

module.exports=blink;
