
let led=function(pin){
  this.pin=pin;
  _l=this;
}
led.prototype.switch=(s)=>{
  clearInterval(_l.i)
  digitalWrite(_l.pin, !s)
}
led.prototype.blink=(times, time)=>{
  clearInterval(_l.i)
  _l.ledOn=false
  var i=0;
  _l.i=setInterval(function(){
    digitalWrite(_l.pin, ledOn)
    ledOn=!ledOn
    i=i+1
    if(i==times*2){
      clearInterval(_l.i)
    }
  },(time || 500))
}

module.exports=blink;
