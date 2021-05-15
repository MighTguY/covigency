$("#createForm").on("click", () => {
  window.open("form.html", "_blank");
});

$("#survey").on("click", () => {
  window.open("https://forms.gle/fuzaqKW8xGNgCjmC6", "_blank");
});

$("#cowin_home").on("click", () => {
  window.open("https://www.cowin.gov.in/home", "_blank");
});

$("#linkedin").on("click", () => {
  window.open("https://www.linkedin.com/in/lucky-sharma/", "_blank");
});

chrome.tabs.getSelected(null, function (tab) {
  console.log(tab.url);
});

var user;

chrome.storage.local.get("user", (data) => {
  if (data.user == null) {
    $("#info_added").hide();
  } else {
    $("#user").text(data.user.username);
    $("#phone").val(data.user.phone);

    if (!isEmpty(data.user.state) && !isEmpty(data.user.district != null)) {
      $("#state").val(data.user.state);
      $("#district").val(data.user.district.split(":")[1]);
    }

    if (!isEmpty(data.user.pincode)) {
      $("#pincode").val(data.user.pincode);
    }

    if (!isEmptyArr(data.user.centers)) {
      $("#centers").text(data.user.centers.join(","));
    }

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

    $("#general_desc").text("Please review your information.");
  }
});

chrome.storage.local.get("enabledCVG", (data)=> {

  if(data.enabledCVG == false) {
    $("#enableButton").removeClass("active");
  } else {
    $("#enableButton").addClass("active");
  }
});

chrome.storage.local.get("enabledNOTI", (data)=> {

  if(data.enabledNOTI == false) {
    $("#enableNotification").removeClass("active");
  } else {
    $("#enableNotification").addClass("active");
  }
});


function isEmpty(str) {
  return str == null || str == "";
}

function isEmptyArr(arr) {
  return arr == null || arr.length == 0;
}

$('#enableButton').on('click', function(event) {
  if(!$(this).hasClass("active")){
        chrome.storage.local.set({
        enabledCVG: true,
      });
  }else{
    chrome.storage.local.set({
      enabledCVG: false,
    });
  }
});


$("#enableNotification").on('click', function(event){
  if(!$(this).hasClass("active")){
    chrome.runtime.sendMessage({type: "notification", options: {
      type: "basic", 
      iconUrl: chrome.extension.getURL("assets/CV128.png"),
      title: "Test",
      message: "Test",
      start: true
  }});
  chrome.storage.local.set({
    enabledNOTI: true,
  });
}else{
  chrome.runtime.sendMessage({type: "notification", options: {
    type: "basic", 
    iconUrl: chrome.extension.getURL("assets/CV128.png"),
    title: "Test",
    message: "Test",
    start: false
}});
chrome.storage.local.set({
  enabledNOTI: false,
});
}
})
