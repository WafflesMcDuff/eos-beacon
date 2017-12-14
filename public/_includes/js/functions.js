const socket      = io();
var selector    = "";
var target      = "";
var clearIsActive = undefined;
var activeColorScheme = '0';
var activeBroadcastPriority   = 1;


/* navigate loads (TARGET).HTML into the MAIN SCREEN div. pretending to go to another page but instead putting it into our existing box.*/
function navigate(target) {
  if(target != "") {
    $('#main').load(target+'.html');
  }
}

/* flashblocks causes a "flash" effect inside the boxes spread over beacon, when for example, a broadcast is received.
this flash should only lasts for a few seconds, by calling the FlashBlocks function again with a small timeout. */
function FlashBlocks(div) {

  if(div == "" || div == undefined) {
    div = '.block';
  }

  /* don't flash mobile devices. */
  if($(window).width() < 769) {
    return false;
  }

  if( $(div).hasClass('flash') ) {
    $(div).removeClass('flash');
  } else {
    $(div).addClass('flash');
  }

}

function getCurrentTime() {
  var currentTime = new Date();
  var currentHours   = currentTime.getHours ( );
  var currentMinutes = currentTime.getMinutes ( );
  currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
  currentHours = ( currentHours == 0 ) ? 12 : currentHours;
  var currentTimeString = currentHours + ":" + currentMinutes + ":" + "&nbsp;ECT";
  return currentTimeString;
}

/* function: broadcast . CLIENT SIDE. This is triggered upon RECEIVING a broadcast from the server (index.js) */
function broadCast(location) {

  /* fills in the blanks. */
  if(location['title'] == null)         {   location['title'] = "Untitled Broadcast" }
  if(location['file'] == null)          {   location['file'] = "404"      }
  if(location['priority'] == null)      {   location['priority'] = "1"    }
  if(location['duration'] == null)      {   location['duration'] = "0"    }
  if(location['colorscheme'] == null)   {   location['colorscheme'] = "0" }

  /*console.log('active: '+ activeBroadcastPriority);*/

  /* checks if anything is set in the broadcast call. */
  if(location) {

    var currentTimeString = getCurrentTime();

    /* weird little optimazation: let the flash function inside our house,
      so we don't end up calling it inside two to four times and then pushing them outside again */
    var FlashFunctie = FlashBlocks;

    /* Hey, I just noticed you loaded a broadcast.HTML file there, let me just.. */
    $.get('/broadcasts/'+location['file']+'.html')
      .done(function(){

        if(location['priority'] > 0 && !isNaN(location['duration'])) {

          if(location['priority'] < activeBroadcastPriority) {

            return false;

          } else {

            /* ALS VIDEO SPELER BESTAAT; MAAK LEEG */
            if($('#broadcastVideo').length > 0 ) {
              console.log('== empty video >>');
              var oldPlayer = document.getElementById('broadcastVideo');
              videojs(oldPlayer).dispose();
            } else {
              console.log('== no transmissions to clear.');
            }

            /* foolproof controle: als DEFAULT word opgegeven telt hij ook als '0' */
            if(location['colorscheme']  == 'default') { location['colorscheme'] = '0'; }
            if(activeColorScheme        == 'default') { activeColorScheme       = '0'; }

            var outString = location['colorscheme'].replace(/[`~!@#$%^&*()_|+=?;:'",<>\{\}\[\]\\\/]/gi, '');
            location['colorscheme'] = outString;

            /* kleurenschema. */
            /* default probeerd default te worden, OF de colorschemes zijn gelijk? */
            if((activeColorScheme == '0' && location['colorscheme'] == '0') || (activeColorScheme == location['colorscheme'])) {
              /* verander niks .*/

            } else if (activeColorScheme != '0'  && location['colorscheme'] == '0') {
              /* UNLOAD DE VORIGE COLORSCHEME, VERVOLGENS: */
              $('link[rel=stylesheet][href~="/_includes/css/alert-'+activeColorScheme+'.css"]').remove();
              activeColorScheme = '0';

            /* actief = default > broadcast = niet-default: */
            } else if (activeColorScheme == '0' && location['colorscheme'] != '0') {

              $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', '/_includes/css/alert-'+location['colorscheme']+'.css') );
              activeColorScheme = location['colorscheme'];

            } else if (location['colorscheme'] != '0' && activeColorScheme != location['colorscheme']) {

              /* laad ACTIVE uit, laad LOCATION in */
              $('link[rel=stylesheet][href~="/_includes/css/alert-'+activeColorScheme+'.css"]').remove();
              $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', '/_includes/css/alert-'+location['colorscheme']+'.css') );
              activeColorScheme = location['colorscheme'];
            }


            $("#notificationContainer").empty();
              $('#notificationContainer').load('/broadcasts/'+location['file']+'.html');


              /* reset de CLEAR naar 1 zodat hij overschrijfbaar is. */
              if(location['priority'] == 99) { location['priority'] = 1; }
              /* update 'Last broadcast' */
              activeBroadcastPriority = location['priority'];

              if(location['title'] != "" /*&& location['title'] != "Clear"*/) {

                var outString = location['title'].replace(/[`~!@#$%^&*()_|+=?;:'",<>\{\}\[\]\\\/]/gi, '');
                location['title'] = outString;

                $("#lastBroadcastTitle").html("<i class='fa fa-bell'></i>&nbsp;" + location['title']);
                $("#lastBroadcastTime").html(currentTimeString);
              }

              if(location['duration'] && location['duration'] == 0) {
                clearBroadcast(0);
              }

              if(location['duration'] && location['duration'] > 0 && !isNaN(location['duration'])) {
                clearBroadcast(location['duration']);
              }

            FlashFunctie('.block');
            setTimeout(function(){
              FlashFunctie('.block');
            },1500);
          }
        }
      })
    .fail(function(){

      /* INCASE the broadcast IS NOT loaded (for example, an error or a file truly doesnt exist), CLEAR the changes and load 404. */

      if(activeColorScheme != '0' && activeColorScheme != 'default') {
        $('link[rel=stylesheet][href~="/_includes/css/colors-'+activeColorScheme+'.css"]').remove();
      }

      FlashFunctie('.block');
      setTimeout(function(){
        FlashFunctie('.block');
      },1500);

      activeColorScheme   = '0';
      activeBroadcastPriority     = 1;

      $("#notificationContainer").empty();
        $("#notificationContainer").load('/broadcasts/404.html');
    });
  }

}

/* SEND THE BROADCAST. This is usually put on buttons, but you can use it from the console when you want to. Or anywhere else, really. */
function sendBroadCast(location) {

  /* check for broadcast location */
  if(!location || location === undefined) {
    console.log('stop!');
  }

  var FlashFunctie = FlashBlocks;

  FlashFunctie('.adm-tab');
  setTimeout(function(){
    FlashFunctie('.adm-tab');
  },1500);

  console.log(location);

  socket.emit('broadcastSend',location);
}


/* functie om de duration toch wel werkend te krijgen - oftewel een broadcast CLEAREN na ingestelde tijd.*/
function clearBroadcast(duration){
  console.log('clear in :' + duration);

  if(duration != "" && duration != null) {

    /* timer? Gebruik die mooie timer en DAN resetten we de broadcast.*/
    if(clearIsActive != undefined && duration > 0) {
      console.log('clear == actief');
      clearTimeout(clearIsActive);
      clearIsActive = setTimeout(function(){
        socket.emit('broadcastSend', bcreset);
        clearIsActive = undefined;
      },duration);

    } else if (clearIsActive != undefined && duration == 0) {
      console.log('clear == nullified');
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    } else if (undefined && duration == 0) {

      /* niks doen. */

    } else {
      clearIsActive = setTimeout(function(){
        socket.emit('broadcastSend', bcreset);
        clearIsActive = undefined;
      },duration);
    }

  } else {

    if(duration === 0) {
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    } else {
      /* geen timer? Gewoon resetten. */
      socket.emit('broadcastSend', bcreset);
      clearTimeout(clearIsActive);
      clearIsActive = undefined;
    }

  }

}

function generateAudioPlayer(audiofile, repeatcount) {

  if(audiofile) {

    console.log(audiofile);

    if(repeatcount == null || repeatcount == undefined) {
      repeatcount = 1;
    }

    if(document.getElementById("custom-audio") !== null) {

      console.log('CUSTOM-audio -> play: ' + audiofile + ' * ' + repeatcount + ' time(s). ');

      if ($(window).width() > 960) {
        $('#custom-audio').empty();
        $('#custom-audio').html('<audio id="generatedaudioplayer" controls="controls" class="hidden">'
        + '<source src="/sounds/'+ audiofile +'" type="audio/mpeg">'
        +'</audio>');

        $('#generatedaudioplayer').trigger('play');

        /* repeat? */

      }

    } else {

      if(document.getElementById("default-audio") !== null) {
        console.log('default-audio -> play');

        $('#custom-audio').empty();
        $('#default-audio').trigger('play');

      }

    }

  } else {

    $('#custom-audio').empty();
    $('#default-audio').trigger('play');
  }

}

/* audio file functie apart */
function generateBCaudio(audiofile) {

  console.log(audiofile);

  if ($(window).width() > 960) {
    $('#BCAUDIO').empty();
    $('#BCAUDIO').html('<audio id="generatedBCAUDIO" controls="controls" class="hidden">'
    + '<source src="/sounds'+ audiofile +'">'
    +'</audio>');

    $('#generatedBCAUDIO').trigger('play');

  }
}



/* portal status. */
function updatePortalStatus(portalstatus) {

  $('.portalstatus').removeClass('blinkContent');

  if($('.portalstatus').html() != "" && portalstatus != "" && portalstatus != null) {

    if(portalstatus == "unstable") {

      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-angle-double-down"></i></span>');
      $('.portalstatus .right h4').html('Connectivity issues');
      $('.portalstatus .right p').html('Portal network unstable. Package loss may occur.');

    } else if(portalstatus == "multirequest") {

      $('.portalstatus').addClass('blinkContent');
      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-warning"></i></span>');
      $('.portalstatus .right h4').html('Multiple requests');
      $('.portalstatus .right p').html('Multiple external requests detected.<br/>Please stand by.');

    } else if (portalstatus == "shutdown") {

      $('.portalstatus').addClass('blinkContent');
      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-warning"></i></span>');
      $('.portalstatus .right h4').html('!! OFFLINE !!');
      $('.portalstatus .right p').html('Portal services currently unavailable.');

    } else if (portalstatus == "active") {

      $('.portalstatus').addClass('blinkContent');
      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-cog fa-spin"></i></span>');
      $('.portalstatus .right h4').html('Active');
      $('.portalstatus .right p').html('Portal activity detected ...');

    } else if (portalstatus == "maintenance") {

      $('.portalstatus').addClass('blinkContent');
      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-info-circle"></i></span>');
      $('.portalstatus .right h4').html('Maintenance Required');
      $('.portalstatus .right p').html('Safety first.');

    } else {

      $('.portalstatus .left').html('<span class="portalstatus-icon"><i class="fa fa-check-circle-o"></i></span>');
      $('.portalstatus .right h4').html('Operational');
      $('.portalstatus .right p').html('Nothing to report.');

    }
  }
}

/* When changing the portal status, play a tune. Or don't. */
function playPortalAudio() {
  if($(window).width() > 769) {
    $('#portalaudio').trigger('play');
  }
}

/* function to create a video player on devices with enough screen width. */
function generateVideo(name, type) {

  if($(window).width() > 1023) {

    $('#video-container').html('<video id="broadcastVideo" class="video-js" controls preload="auto"><source src="/video/'+name+'" type="video/'+type+'"></source></video>');

      /* ask videojs to turn our video element into a tuned up video element. */
      videojs("broadcastVideo", {"controls": true, "autoplay": true, "preload": "auto"}, function(){

    });

  } else {

    /* client's screen is too small, put on a fallback instead. */
    $('#video-container').html(
      '<div class=\"container-fluid\">'
      + '<h2>Broadcast:Transmission</h2>'
      + '<p>Video tranmission is currently playing on compatible/certified devices.</p>'
      + '<br/>'
      + '<div class=\"animloadbar\">'
      +   '<span class=\"animloadbar-bar\"></span>'
      + '</div>'
      +'</div>'
    );

  }

}


/* CLOCK */
function updateClock() {
  var dow;
	var currentTime = new Date();
    var dd = currentTime.getDate();
    var mm = currentTime.getMonth()+1; /*January is 0!*/
    /* var dow = currenTime.prototype.getDay();*/
    if(dd < 10){
      dd='0'+dd;
    }

    if (dd == 10) {
      dd    = '13';
      dow   = 'FRIDAY';
    } else if (dd == 11) {
      dd    = '14';
      dow   = 'SATURDAY';
    } else if (dd == 12) {
      dd    = '15';
      dow   = 'SUNDAY';
    } else {
      dd    = '13';
      dow   = 'FRIDAY';
    }

  	var currentHours   = currentTime.getHours ( );
  	var currentMinutes = currentTime.getMinutes ( );
  	var currentSeconds = currentTime.getSeconds ( );

  	/* Pad the minutes and seconds with leading zeros, if required */
    currentHours = ( currentHours < 10 ? "0" : "" ) + currentHours;
  	currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
  	currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;

  	/* Compose the string for display */
  	var currentTimeString ="[&nbsp;" + currentHours + ":" + currentMinutes + ":" + currentSeconds + "&nbsp;ECT&nbsp;]";

   	$("#clock").html(currentTimeString);
    $("#dd").html(dd);
    $("#dow").html(dow);

    /* $("#dow").html(dow);*/
 }

 $(document).ready(function() {
    setInterval('updateClock()', 1000);
 });
