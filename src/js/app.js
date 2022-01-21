// Tooltip support
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

// Number rounding based on weewx values
// Example: Number: 34.5678 Format: %.2f Result: 34.57
function formatNumber(no, format) {
    // Extract number of decimal places from format
    format = format.replace(/[^0-9]/g, '');
    return no.toFixed(format);
}

window.onbeforeunload = function() {
    mqttDisconnect();
}

var mqttConnected = false;
var client;

// does not work
function startsWithAlert(index, className) {
    if (className.startsWith('alert-')) {
        return className;
    }
}

function mqttConnectedStateChanged() {
    var element = jQuery('#live-connection-alert');
    // does not work
    // element.removeClass(startsWithAlert);
    element.removeClass('alert-warning alert-danger alert-info alert-success');
    if (mqttConnect) {
        var icon = '<i class="bi bi-check-circle-fill"></i>';
        var content = '<div class="ms-1">Live mit Wetterstation verbunden.</div>';
        element.html(icon + content);
        element.addClass('alert-success');
    }
    else {
        var icon = '<i class="bi bi-exclamation-triangle-fill"></i>';
        var content = '<div class="ms-1">Es konnte leider keine Live-Verbindung hergestellt werden.</div>';
        element.html(icon + content);
        element.addClass('alert-danger');
    }
}

function onConnected() {
    try {
        client.subscribe("weather/loop");

        mqttConnected = true;
        console.log("Live Connected");
        mqttConnectedStateChanged();
    }
    catch(e) {
        console.log("Failed to subscribe to topic!")
        console.log(error);
    }
}

function onFailure() {
    mqttConnected = false;
}

function onConnectionLost(responseObject) {
    mqttConnected = false;
    if (responseObject.errorCode !== 0) {
        console.error("Live-Connection lost!");
        console.error(responseObject.errorMessage);
        mqttConnectedStateChanged();
    }
}

function onMessageArrived(message) {
    console.log("MQTT: New data incomming")
    update_current_wx(message.payloadString);
}

function mqttConnect() {
    client = new Paho.MQTT.Client("broker.ikg-wetter.de", 8081, "webapp" + Math.floor(Math.random() * 999999999))
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    var options = {
        timeout: 13,
        useSSL: true,
        mqttVersion: 3,
        onSuccess: onConnected,
        onFailure: onFailure
    };
    client.connect(options);
}

function mqttDisconnect() {
    if (client === null) {
        return;
    }
    client.unsubscribe("weather/loop");
    client.disconnect();
}

// Handle MQTT message
function update_current_wx(data) {
    var data = jQuery.parseJSON(data);

    if (data.hasOwnProperty("dateTime")) {
        // multiply by 1000 so that the argument is in milliseconds not seconds
        var date = new Date(data['dateTime']*1000);
        var day = date.toLocaleDateString();
        var time = date.toLocaleTimeString();
        jQuery('#last-refresh-datetime-display').html(day + " " + time);
    }

    jQuery('.temprow').find("h4").each(function() {
        var thisElementClass = jQuery(this).attr("class").split(' ')[1];

        // only works with celcius
        if (thisElementClass.toLowerCase() === "outTemp".toLowerCase()) {
            thisElementClass = "outTemp_C";
            if (data.hasOwnProperty(thisElementClass)) {
                var outTemp = parseFloat(data[thisElementClass]).toFixed(1);
                jQuery(this).html(outTemp.toString()+"°C");
                return;
            }
        } else if (thisElementClass.toLowerCase() === "outHumidity".toLowerCase()) {
            if (data.hasOwnProperty(thisElementClass)) {
                var humidity = parseFloat(data[thisElementClass]).toFixed(0);
                jQuery(this).html(humidity.toString()+"%");
                return
            }
        } else if (thisElementClass.toLowerCase() === "barometer".toLowerCase()) {
            // thisElementClass = "altimeter_hPa";
            thisElementClass = "barometer_hPa";
            if (data.hasOwnProperty(thisElementClass)) {
                var barometerHPa = parseFloat(data[thisElementClass]).toFixed(1);
                jQuery(this).html(barometerHPa.toString()+" hPa");
                return;
            }
        } else if (thisElementClass.toLowerCase() === "windSpeed".toLowerCase()) {
            thisElementClass = "windSpeed_kph";
            if (data.hasOwnProperty(thisElementClass) && data.hasOwnProperty("windDir")) {
                var vec_dir = data["windDir"];
                var vec_key = '';
                // Detect key based on vec direction (0-360). 45° steps, using the middle +- 45/2=22.5
                if(vec_dir > 337.5 || vec_dir <= 22.5) {
                    vec_key = 'N';
                }
                if(vec_dir > 22.5 && vec_dir <= 67.5) {
                    vec_key = 'NO';
                }
                if(vec_dir > 67.5 && vec_dir <= 112.5) {
                    vec_key = 'O';
                }
                if(vec_dir > 112.5 && vec_dir <= 157.5) {
                    vec_key = 'SO';
                }
                if(vec_dir > 157.5 && vec_dir <= 202.5) {
                    vec_key = 'S';
                }
                if(vec_dir > 202.5 && vec_dir <= 247.5) {
                    vec_key = 'SW';
                }
                if(vec_dir > 247.5 && vec_dir <= 292.5) {
                    vec_key = 'W';
                }
                if(vec_dir > 292.5 && vec_dir <= 337.5) {
                    vec_key = 'NW';
                }
                var classList = Array.from(document.getElementsByClassName('wi-wind').item(0).classList);
                jQuery('.wi-wind')
                    .removeClass(classList.filter(c => c.startsWith('from') && c.endsWith("-deg")).join(' '))
                    .addClass('from-'+parseFloat(parseFloat(vec_dir).toFixed(0)).toString()+'-deg');

                var windSpeed = parseFloat(parseFloat(data[thisElementClass]).toFixed(0)) + " km/h " + vec_key;
                // .toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0}) + " km/h " + vec_key;
                jQuery(this).html(windSpeed);
                return;
            }
        } else if (thisElementClass.toLowerCase() === "rain".toLowerCase()) {
            // rainRate_cm_per_hour or rain24_cm or hourRain_cm or dayRain_cm
            // rainCount_count or rain_cm
            thisElementClass = "rainRate_cm_per_hour";
            // TODO implement
            return;
        } else if (thisElementClass.toLowerCase() === "windchill".toLowerCase()) {
            thisElementClass = "windchill_C";
            if (data.hasOwnProperty(thisElementClass)) {
                var windChill = parseFloat(data["windchill_C"]).toFixed(1);
                jQuery(this).html(windChill.toString()+"°C");
                return;
            }
        } else if (thisElementClass.toLowerCase() === "UV".toLowerCase()) {
            if (data.hasOwnProperty(thisElementClass)) {
                var uv = parseFloat(data[thisElementClass]).toFixed(1);
                jQuery(this).html(uv);
                return;
            }
        } else if (thisElementClass.toLowerCase() === "radiation".toLowerCase()) {
            thisElementClass = "radiation_Wpm2";
            if (data.hasOwnProperty(thisElementClass)) {
                var rad = parseFloat(data[thisElementClass]).toFixed(0);
                jQuery(this).html(rad.toString()+" W/m²");
                return;
            }
        } else if (thisElementClass.toLowerCase() === "cloudbase".toLowerCase()) {
            thisElementClass = "cloudbase_meter";
            if (data.hasOwnProperty(thisElementClass)) {
                var cb = parseFloat(data[thisElementClass]).toFixed(0);
                jQuery(this).html(cb.toString()+" Meter");
                return;
            }
        }
    });
}
