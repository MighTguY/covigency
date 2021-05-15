var statesDistrictMap = {};
var promises = [];
var loggedData = false;

function getDistricts(vUrl, stateId, stateName) {
  return $.getJSON(vUrl + "districts/" + stateId).then(function (data) {
    var districts = [];
    data.districts.forEach((ob) => {
        var districtJ = {
            "district_id": ob.district_id+"",
            "district_name": ob.district_name + ""
        }
        districts.push(districtJ)
    });
    return { stateName: stateName, districts: districts };
  });
}

// function getStates(vUrl) {
//     return $.getJSON(vUrl + "states").then(function (data) {
//         var districtsMap = {};
//         data.states.map((ob) => {
//             getDistricts(vUrl, ob.state_id)
//         }).map(fcall => fcall.then(districts => {
//             districtsMap[ob.state_name+""] = districts
//         }));
//         return districtsMap;
//     })
// }

function getStates(vUrl) {
  return $.getJSON(vUrl + "states").then(function (data) {
    var states = [];
    data.states.forEach((ob) => {
      var stateName = ob.state_name + "";
      var stateId = ob.state_id;
      promises.push(getDistricts(vUrl, stateId, stateName));
      states.push(stateName);
    });
    $.when.apply($, promises).then(function () {
      var districtsMap = {};
      for (var i = 0; i < arguments.length; i++) {
        districtsMap[arguments[i].stateName] = arguments[i].districts;
      }
      statesDistrictMap = districtsMap;
      chrome.storage.local.set({
        statesDistrictMap: statesDistrictMap,
      });
      console.log(
        "districts data has been fetched " + statesDistrictMap.length
      );
    });

    return states;
  });
}

$(document).ready(function () {
  var vUrl = "https://cdn-api.co-vin.in/api/v2/admin/location/";

  chrome.storage.local.get("statesDistrictMap", (response) => {
    var stateDistrictMapFromCache = response.statesDistrictMap;

    if (stateDistrictMapFromCache == null) {
      console.log("Fetching from URL");
      getStates(vUrl).then((data) => {
        createAutoCompleteOnStates(data);
      });
    } else {
      statesDistrictMap = stateDistrictMapFromCache;
      console.log("Fetching from Chrome Cache");
      createAutoCompleteOnStates(Object.keys(stateDistrictMapFromCache));
    }
    updateDocFromCache();
  });
});

function createAutoCompleteOnStates(stateNames) {
  stateNames.forEach((state) => {
    $("#state").append(`<option value="${state}">
                                       ${state}
                                  </option>`);
  });
  console.log("States data populated");
}

$("#state").change(function (data) {
  var stateName = $("#state").val();
  var districts = statesDistrictMap[stateName + ""];
  $("#district").find("option:gt(0)").remove();
  districts.forEach((district) => {
    $("#district").append(`<option value="${district.district_id}:${district.district_name}">
    ${district.district_name}
</option>`);
  });
});


$("#district").change(function() {
    if(this.value != "" && this.value !=null) {
        var districtId = this.value.split(":")[0];
        if(districtId == null || districtId == "") {
            return;
        }
        var url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id="+districtId+"&date="+getDate();
        fetchCenters(url)
        $("#pincode").prop('required',false);
    } else {
        $("#pincode").prop('required',true);
    }
})

$("#pincode").change(function() {
    console.log(this.value)
    if(this.value != "" && this.value !=null) {
        console.log(this.value)
        var url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode="+this.value+"&date="+getDate();
        fetchCenters(url)
        $("#district").prop('required',false);
        $("#state").prop('required',false);
    } else {
        $("#district").prop('required',true);
        $("#state").prop('required',true);
    }
})

function fetchCenters(vUrl) { 
    console.log("fetching centers from "+vUrl)
    $("#centers").find("option:gt(0)").remove();
    fetchCenteByUrl(vUrl).then(data => {
            console.log("gogeta")
            console.log(data);
        data.forEach(center=> {
            $("#centers").append(`<option value="${center}">
    ${center}
    </option>`);
        })
    })
}

function fetchCenteByUrl(vUrl) {
    return $.getJSON(vUrl).then(function (data) {
        var centers = [];
        data.centers.forEach((ob) => {
          var name = ob.name + "";
          centers.push(name);
        });
        console.log("centers size"+centers.length)
        return centers;
      });
}


function getDate() {
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

return dd + '/' + mm+ '/' + yyyy;
}


$("#submit").click(function(){

    var userObj = {}

    var validate = $('#covigencyForm')[0].checkValidity(); 
    if(validate == false) {
        $("#covigencyForm").find("#submit-hidden").click();
        return false;
    }
    userObj["state"] = $("#state").val()
    userObj["district"] = $("#district").val()
    userObj["pincode"] = $("#pincode").val()
    userObj["phone"] = $("#phone").val()
    userObj["username"] = $("#username").val()
    userObj["centers"] = $( "#centers" ).val();

    userObj["age_18"] = $( "#age_18" ).is(":checked");
    userObj["age_45"] = $( "#age_45" ).is(":checked");
    userObj["paid_vaccine"] = $( "#paid_vaccine" ).is(":checked");
    userObj["book_any"] = $( "#book_any" ).is(":checked");

    userObj["time_slot_1"] = $( "#time_slot_1" ).is(":checked");
    userObj["time_slot_2"] = $( "#time_slot_2" ).is(":checked");
    userObj["time_slot_3"] = $( "#time_slot_3" ).is(":checked");
    userObj["time_slot_4"] = $( "#time_slot_4" ).is(":checked");
    userObj["today_exclude"] = $( "#today_exclude" ).is(":checked");

    chrome.storage.local.set({
        user: userObj,
      });
      alert("Details saved!")
  });


  
  function updateDocFromCache() {
    chrome.storage.local.get("user", (data) => {

      $("#state").val(data.user.state);
      $("#district").val(data.user.district);
      $("#pincode").val(data.user.pincode);
      $("#phone").val(data.user.phone);
      $("#username").val(data.user.username);
      $("#centers").val(data.user.centers);


if (data.user.book_any) {
      $("#book_any").prop("checked", true);
    } else {
      $("#book_any").prop("checked", false);
    }
    if (data.user.age_18) {
      $("#age_18").prop("checked", true);
    } else {
      $("#age_18").prop("checked", false);
    }
    if (data.user.age_45) {
      $("#age_45").prop("checked", true);
    } else {
      $("#age_45").prop("checked", false);
    }
    if (data.user.paid_vaccine) {
      $("#paid_vaccine").prop("checked", true);
    } else {
      $("#paid_vaccine").prop("checked", false);
    } 

    if (data.user.paid_vaccine) {
      $("#paid_vaccine").prop("checked", true);
    } else {
      $("#paid_vaccine").prop("checked", false);
    } 

    if (data.user.time_slot_4) {
      $("#time_slot_4").prop("checked", true);
    } else {
      $("#time_slot_4").prop("checked", false);
    } 
    if (data.user.time_slot_3) {
      $("#time_slot_3").prop("checked", true);
    } else {
      $("#time_slot_3").prop("checked", false);
    } 
    if (data.user.time_slot_2) {
      $("#time_slot_2").prop("checked", true);
    } else {
      $("#time_slot_2").prop("checked", false);
    } 
    if (data.user.time_slot_1) {
      $("#time_slot_1").prop("checked", true);
    } else {
      $("#time_slot_1").prop("checked", false);
    } 
    if (data.user.today_exclude) {
      $("#today_exclude").prop("checked", true);
    } else {
      $("#today_exclude").prop("checked", false);
    } 


    })
  }