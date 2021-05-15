var date = new Date();
var h = date.getHours();
var m = date.getMinutes();
var s = date.getSeconds();
var y = date.getFullYear();
var candidates = [];
var tatkalTime = false;
var user = null;

var waitForEl = function (selector, callback) {
  if (jQuery(selector).length) {
    callback();
  } else {
    setTimeout(function () {
      waitForEl(selector, callback);
    }, 100);
  }
};

var waitForEl1 = function (selector, callback) {
  if (jQuery(selector).length == 0) {
    callback();
  } else {
    setTimeout(function () {
      waitForEl(selector, callback);
    }, 100);
  }
};

var waitForEl2 = function (selector, callback) {
  if (jQuery(selector) != null) {
    callback();
  } else {
    setTimeout(function () {
      waitForEl(selector, callback);
    }, 100);
  }
};

$(document).ready(function () {
  chrome.storage.local.get("enabledCVG", (isScriptEnabled) => {
    console.log(isScriptEnabled);
    if (isScriptEnabled.enabledCVG == false) {
      return;
    }

    var checkForCandidateSelection = setInterval(function () {
      if (
        $("ion-row").filter(".sepreetor").length > 0 &&
        window.location.pathname == "/dashboard"
      ) {
        console.log($("ion-row").filter(".sepreetor").length);
        // clearInterval(checkForCandidateSelection);
        selectCandidates();
      }
    }, 1000); // check every 100ms

    var checkForAppointment = setInterval(function () {
      if (
        $("#status").length > 0 &&
        window.location.pathname == "/appointment"
      ) {
        console.log($("#status").length);
        clearInterval(checkForAppointment);
        selectAppointment();
      } else {
        console.log("waiting for appointment page");
      }
    }, 1000); // check every 100ms
  });
});

function selectCandidates() {
  chrome.storage.local.get("user", (data) => {
    console.log("Check now");
    user = data.user;
    var age18 = data.user.age_18;
    var age45 = data.user.age_45;

    $("ion-row")
      .filter(".sepreetor")
      .map(function () {
        var age =
          y -
          Number(
            this.children[0].children[0].children[2].children[0].children[1].innerText.trim()
          );
        console.log("age of candidate is " + age);
        if (age18 && age >= 18 && age < 45) {
          this.children[0].children[0].children[3].children[1].children[0].children[0].children[0].click();
          candidates.push(
            this.children[0].children[0].children[0].children[0].children[1]
              .children[0].children[1].innerText
          );
        }
        if (age45 && age > 45) {
          this.children[0].children[0].children[3].children[1].children[0].children[0].children[0].click();
          candidates.push(
            this.children[0].children[0].children[0].children[0].children[1]
              .children[0].children[1].innerText
          );
        }
      });
    console.log("Candidates are " + candidates.length);
    console.log(candidates);
    $("ion-button").filter(".register-btn").click();
  });
}

function selectAppointment() {
  chrome.storage.local.get("user", (data) => {
    var user = data.user;
    if (user.pincode != "" && user.pincode != null) {
      //Todo for Pincode
    } else {
      waitForEl1($(".ion-page-invisible"), function () {
        setTimeout(() => {
          waitForEl($("#status"), function () {
            $("#status").click();
            waitForEl($("mat-select[formcontrolname='state_id']"), function () {
              setTimeout(() => {
                searchByDistrictAndState(user);
              }, 1000);
            });
          });
        }, 1000);
      });
    }
  });
}

function searchByDistrictAndState(user) {
  $("mat-select[formcontrolname='state_id']").click();
  setTimeout(() => {
    waitForEl($("div[role='listbox'] > mat-option"), function () {
      $("div[role='listbox'] > mat-option").map(function () {
        var state = this.children[0].innerText;
        if (state == user.state) {
          console.log("State: " + state);
          $(this).click();
        }
      });
      setTimeout(() => {
        waitForEl($("mat-select[formcontrolname='district_id']"), function () {
          $("mat-select[formcontrolname='district_id']").click();
          setTimeout(() => {
            waitForEl($("div[role='listbox'] > mat-option"), function () {
              $("div[role='listbox'] > mat-option").map(function () {
                var city = this.children[0].innerText;
                if (city == user.district.split(":")[1]) {
                  console.log("District: " + city);
                  $(this).click();
                }
              });
              setTimeout(() => {
                $(
                  "ion-button[class='pin-search-btn district-search md button button-solid ion-activatable ion-focusable hydrated']"
                ).click();

                applyFilters(user);
              }, 1000);
            });
          }, 1000);
        });
      }, 2000);
    });
  }, 1000);
}

function applyFilters(user) {

  setTimeout(() => {
    waitForEl($("div[class='agefilterblock ng-star-inserted']"), function () {
      if (user.age_18) {
        $("div[class='agefilterblock ng-star-inserted'] #c1").click();
      }
      if (user.age_45) {
        $("div[class='agefilterblock ng-star-inserted'] #c2").click();
      }
      if (user.paid_vaccine) {
        $("div[class='agefilterblock ng-star-inserted'] #c6").click();
      }

      $("div[class='agefilterblock ng-star-inserted'] #c7").click();

      console.log("filters applied");
      selectCenter(user)
    });
  }, 1000);
}

function selectCenter(user) {

  console.log("Selecting centers");
  setTimeout(() => {
    waitForEl($("mat-selection-list[formcontrolname='center_id'] >div > mat-list-option"), function () {
      var center = [];

      //Prefered Slots

      $(
        "mat-selection-list[formcontrolname='center_id'] >div > mat-list-option"
      ).each(function () {
        var centerName = this.children[0].children[1].children[0].children[0].children[0].children[0].innerText;
        var idx = user.centers.findIndex(item => centerName.trim().toLowerCase() === item.trim().toLowerCase());
        if ((user.centers != null || user.centers.length == 0) && idx === -1) {
          return true;
        }
        $(this.children[0].children[1].children[0].children[1].children[0].children)
          .map(function () {
            return this.children[0].children[0];
          })
          .filter(function () {
            return $(this).attr("tooltip") != "No Session Available";
          })
          .each(function (index) {

            if (index == 0 && user.today_exclude == true) {
              return true;
            }
            var shotsAvailable = this.children[0].innerText;
            if (shotsAvailable.trim() != "Booked") {
              center.push(this.children[0]);
              console.log("Ceneter " + centerName + " With " + shotsAvailable + " Selected")
              return false;
            }
          });
        if (center.length > 0) {
          return false;
        }
      });

      if (center.length == 0 && user.book_any == true) {
        console.log("Searching for all centers")
        $(
          "mat-selection-list[formcontrolname='center_id'] >div > mat-list-option"
        ).each(function () {
          var centerName = this.children[0].children[1].children[0].children[0].children[0].children[0].innerText;
          $(this.children[0].children[1].children[0].children[1].children[0].children)
            .map(function () {
              return this.children[0].children[0];
            })
            .filter(function () {
              return $(this).attr("tooltip") != "No Session Available";
            })
            .each(function () {
              var shotsAvailable = this.children[0].innerText;
              if (shotsAvailable.trim() != "Booked") {
                center.push(this.children[0]);
                console.log("Ceneter " + centerName + " With " + shotsAvailable + " Selected")
                return false;
              }
            });
          if (center.length > 0) {
            return false;
          }
        });
      }
      if (center.length == 0) {
        //center Not found
        alert("No vaccination slot found for this location");
        return false;
      } else {
        center[0].click();
      }
      selectSlots(user)
    })
  }, 1000);
}

function selectSlots(user) {

  setTimeout(() => {
    waitForEl($("div.time-slot-list>ion-button"), function () {

      if (user.time_slot_1) {
        $("div.time-slot-list>ion-button").filter(":nth-child(1)").click()
        return false;
      }
      if (user.time_slot_2) {
        $("div.time-slot-list>ion-button").filter(":nth-child(2)").click()
        return false;
      }

      if (user.time_slot_3) {
        $("div.time-slot-list>ion-button").filter(":nth-child(3)").click()
        return false;
      }

      if (user.time_slot_4) {
        $("div.time-slot-list>ion-button").filter(":nth-child(4)").click()
        return false;
      }

      $("div.time-slot-list>ion-button").filter(":nth-child(1)").click()
    })
  }, 2000);


}
