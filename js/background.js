console.log("Background script running")

var centerByDistrictURL = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=";
var ceterByPinURl = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=";
var user = null;
var notificationsOpt = null;
var startPolling = null ;
var lastNotificationSent = null;
var myNotificationID = null;
var urlCowin = "https://selfregistration.cowin.gov.in/" 

function getDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "notification") {
        chrome.storage.local.get("user", (data) => {
            if(data.user == null) {
                return false;
            } 
            user = data.user;
            notificationsOpt = request.options;
            if(request.options.start == true) {
                startPolling = setInterval(function () {
                    var vUrl = fetchVUrl(user);
                    console.log("running");
                    if (vUrl == "" || vUrl == null) {
                        return false;
                    }
                    getActiveCenters(vUrl,user);
                },1800000); 
            } 
            if(request.options.start == false) {
                console.log("stopped notifications")
                clearInterval(startPolling);
            } 
        });
        sendResponse();
    }
});


function getActiveCenters(url, user) {

    return $.getJSON(url).then(data => {
        var preferedCentersFiltered = []
        data.centers.forEach(ob => {

            if (checkAvailability(ob, user.age_18, user.age_45)) {
                if (user.centers == null || user.centers.length == 0 || user.book_any) {
                    preferedCentersFiltered.push(ob.name);
                } else {
                    var idx = user.centers.findIndex(item => item.trim().toLowerCase() === ob.name.trim().toLowerCase());
                    if (idx != -1) {
                        preferedCentersFiltered.push(ob.name);
                    }
                }
            }
        })
        sendNotification(preferedCentersFiltered);
    })
}



function checkAvailability(center, age18, age45) {
    var res = false;
    center.sessions.forEach(sess => {
        if (sess.available_capacity > 1 && age18 && sess.min_age_limit == 18) {
            res = true;
            return false;
        }
        if (sess.available_capacity > 1 && age45 && sess.min_age_limit == 45) {
            res = true;
            return false;
        }
    })
    return res;
}

function fetchVUrl(user) {
    if (user.pincode != null && user.pincode != "") {
        return ceterByPinURl + user.pincode + "&date=" + getDate();
    }
    if (user.district != null && user.district != "") {
        return centerByDistrictURL + user.district.split(":")[0] + "&date=" + getDate();
    }
}

function sendNotification(preferedCentersFiltered) {
    if(preferedCentersFiltered == null || preferedCentersFiltered.length == 0 || notificationsOpt == null) {
        return false;
    }
    var currentDate = new Date();
    if(!doWeNeedToSend(currentDate)) {
        return false;
    }
    options = {}
    options.type = notificationsOpt.type;
    options.iconUrl = notificationsOpt.iconUrl;
    options.title = "Covid Vaccine Centers Found"
    options.message = preferedCentersFiltered.length+" centers found as per your match, open for vaccination. Click here to start"
    options.buttons = [{
        title: "Open link",
        iconUrl: ""
    }]
    chrome.notifications.create('notification', options, function(id) { myNotificationID = id; });
    console.log('Notification created!');
    lastNotificationSent = currentDate;
}

function doWeNeedToSend(today) {
    if (lastNotificationSent == null) {
        return true;
    }
    var diffMs = (today - lastNotificationSent);
    var diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    if(diffHrs > 2) {
        return true;
    } 
    return false;
}

/* Respond to the user's clicking one of the buttons */
chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
    if (notifId === myNotificationID) {
        window.open(urlCowin);
    }
});
chrome.notifications.onClosed.addListener(function() {
    saySorry();
});

/* Handle the user's rejection 
 * (simple ignore if you just want to hide the notification) */
function saySorry() {
    alert("Sorry to bother you !");
}
