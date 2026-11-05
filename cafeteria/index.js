/* 
  MiMTSS Login
  Updated: August 31, 2020

  * District/Facility choice
  * Veracity LRS
  * Auto-select Storyline launch file

*/

var lrsConfig = {
  project: 'mimtss',

  prod: {
    endpoint: 'https://mimtss.veracity.fpg.unc.edu/xapi/',
    auth: 'Basic bmVrYXRjOnRhdGhpcw==',
  },

  sandbox: {
    endpoint: 'https://mimtss.veracity.fpg.unc.edu/xapi/',
    auth: 'Basic bmVrYXRjOnRhdGhpcw==',
  },

  debug: { // TorranceLearning
    endpoint: 'https://cloud.scorm.com/lrs/0LNX522VAG/sandbox/',
    auth: 'Basic QWw2d3dwVHpRX3BISVNpNm1nWTo5Vm9RYjZJOUNLVDhIb05yVVI0',
  },

};

var app = {
  launchFile: 'index_lms.html', // fallback

  forceSandbox: false, // set to true if you need to

  init: function () {
    app.query = app.parseQueryString() || {};
    app.checkForSandbox();

    // SET TO FALSE or comment out the line below for non-validated login (public access)
    // app.privateUsers = app.query.privateUsers || true;
    app.privateUsers = false;

    app.query.profileId = app.query.profileId || lrsConfig.project;

    app.getCourseInfo(app.checkQueryString);

    app.bindEvents();
    app.selectBoxes.init();
  },

  userEmailList: function () {
    return [];
  },

  checkForSandbox: function () {
    // var isSandboxSite = window.location.host.indexOf('prototype.fpg.unc.edu') > -1;
   var isSandboxSite = false; 
app.useSandbox = app.forceSandbox || isSandboxSite || app.query.sandbox;

    var envEl = document.querySelector('.environment-type-sandbox');

    if (envEl) {
      if (app.useSandbox) {
        envEl.classList.remove('hidden');
      } else {
        envEl.classList.add('hidden');
      }
    }
  },

  radioValues: {},

  selectBoxes: {
    defaultOpts: {
      selectOnClose: true,
    },

    init: function () {
      var self = this;

      this.getDropdownData(function () {
        self.createDistrictDropdown();
      });

    },

    getDropdownData: function (cb) {
      $.get('districts-facilities.json', function (data) {
        if (data) {
          data.sort(function (a, b) {
            if (a.text > b.text) { return 1; }
            if (a.text < b.text) { return -1; }
            if (a.text === b.text) { return 0; }
          });
        }

        app.dropdownData = data;
        cb();
      }).fail(function (err) {
        console.error('error getting JSON data:', err);
      });
    },

    createDistrictDropdown: function () {
      var options = $.extend({}, this.defaultOpts);

      options.placeholder = 'Select a district...';

      // https://stackoverflow.com/a/57468425/5323112
      // This "fake ajax pagination" gives better performance
      var timer = null;

      options.ajax = {
        delay: 100,
        transport: function (params, success, failure) {
          var pageSize = 10;
          var term = (params.data.term || '').toLowerCase();
          var page = (params.data.page || 1);

          if (timer) {
            clearTimeout(timer);
          }

          timer = setTimeout(function () {
            timer = null;

            var results = app.dropdownData
              .filter(function (district) {
                return district.text.toLowerCase().indexOf(term) > -1;
              });

            var paged = results.slice((page - 1) * pageSize, page * pageSize);

            var options = {
              results: paged,
              pagination: {
                more: results.length >= page * pageSize
              }
            };
            success(options);
          }, params.delay);
        }
      };

      $('.select2-district')
        .select2(options)
        .on('change.select2', function (e) {
          app.selectBoxes.onDistrictChange(e.target.value);
        });
    },

    deselectRadiosByName: function (name) {
      $('input[name="' + name + '"]').prop('checked', false);
    },

    resetLowerForm: function () {
      app.radioValues = {};
      app.changeBlockVisibility('login-district-level', true);

      this.deselectRadiosByName('login-district-level-boolean');
      app.changeBlockVisibility('login-facility-wrapper', false);

      $('#login-button').attr('disabled', true);
    },

    onDistrictChange: function (districtCode) {
      this.resetLowerForm();

      var selectedDistrict = app.dropdownData.filter(function (district) {
        return district.id == districtCode;
      })[0];

      var facilityList = selectedDistrict.schools;

      this.updateFacilities(facilityList);
    },

    onDistrictLevelChange: function (e) {
      app.radioValues.districtLevel = e.currentTarget.value;

      var showFacilityList = e.currentTarget.value == 'false';
      $('#login-button').attr('disabled', showFacilityList);

      app.changeBlockVisibility('login-facility-wrapper', showFacilityList);
      app.selectBoxes.deselectRadiosByName('login-mtss-boolean');
    },

    updateFacilities: function (facilityList) {
      var options = $.extend({}, this.defaultOpts);
      options.placeholder = 'Select a facility...';

      options.data = facilityList;

      var $selectEl = $('.select2-facility');
      var isInitialized = $selectEl.hasClass("select2-hidden-accessible");

      if (isInitialized) {
        $selectEl.select2('destroy');
        $selectEl.val(null).trigger('change');
        $selectEl.empty();
        $selectEl.append('<option></option>');

        app.changeBlockVisibility('login-mtss', false);
        this.deselectRadiosByName('login-mtss-boolean');
      }

      $selectEl
        .select2(options)
        .on('change.select2', function (e) {
          // var facilityCode = e.target.value;
          app.changeBlockVisibility('login-mtss', true);
        });
    },

    onMtssChange: function (e) {
      app.radioValues.mtss = e.currentTarget.value;
      $('#login-button').attr('disabled', false);
    },
  },

  checkQueryString: function () {
    var query = app.query;
    var showLoginForm = true;

    if (query) {
      if (query.endpoint && query.auth) {
        app.endpoint = query.endpoint || query.endpoint;
        app.auth = query.auth || query.auth;

        var id = query.id || '';
        var name = query.name || '';
        var email = query.email || '';

        if (id || email) {
          showLoginForm = false;
          app.loginUser(id, name, email);
        }
      }
    }

    if (showLoginForm) {
      document.querySelector('.login').classList.remove('hidden');
    }
  },

  bindEvents: function () {
    document.getElementById('reset-button').addEventListener('click', function () {
      this.classList.add('hidden');
      document.getElementById('login-button').classList.remove('hidden');
      document.getElementById('login-alerts').classList.add('hidden');
      document.getElementById("login-form").reset();
    });


    var radioDistrictLevelSel = 'input.radio-btn[name="login-district-level-boolean"]';
    var radioMtssSel = 'input.radio-btn[name="login-mtss-boolean"]';

    var radiosDistrictLevelBool = document.querySelectorAll(radioDistrictLevelSel);
    var radiosMtssBool = document.querySelectorAll(radioMtssSel);

    for (var i = 0; i < radiosDistrictLevelBool.length; i++) {
      radiosDistrictLevelBool[i].addEventListener("change", app.selectBoxes.onDistrictLevelChange);
    }

    for (var i = 0; i < radiosMtssBool.length; i++) {
      radiosMtssBool[i].addEventListener("change", app.selectBoxes.onMtssChange);
    }
  },

  changeBlockVisibility: function (blockClass, doShow) {
    var el = document.querySelector('.' + blockClass);
    doShow ? el.classList.remove('hidden') : el.classList.add('hidden');
  },

  parseQueryString: function () {
    var fullQuery = top.window.location.search || top.window.location.href || '';
    if (!fullQuery) { return; }
    var query = {};
    var queryString = fullQuery.split('?')[1];
    if (!queryString) return '';
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
  },

  displayCourseName: function (courseTitle) {
    document.getElementById('course-name').innerText = courseTitle;
  },

  getCourseInfo: function (cb) {
    app.getTincanXML(function (courseInfo) {
      if (courseInfo) {
        console.log('courseInfo:', courseInfo);
        app.courseID = courseInfo.courseID;
        app.courseName = courseInfo.courseName;
        app.displayCourseName(courseInfo.courseName);
      } else {
        console.warn('No tincan.xml info found.');
        app.courseID = window.location.href;
        app.displayCourseName("Login");
      }
      // app.encodeActivityID(app.courseID);

      if (cb) { cb(); }
    });
  },

  getTincanXML: function (callback) {
    var output = "";
    var httpRequest;

    function _handleResponse() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          var rawXML = httpRequest.responseText;
          app.parseTincanXML(rawXML, function (courseInfo) {
            callback(courseInfo);
          });
        } else {
          console.error('There was a problem with the tincan.xml request.');
          callback("");
        }
      }
    }

    function _makeRequest() {
      httpRequest = new XMLHttpRequest();

      if (!httpRequest) {
        console.error('Giving up :( Cannot create an XMLHTTP instance');
        return false;
      }
      httpRequest.onreadystatechange = _handleResponse;
      httpRequest.open('GET', 'tincan.xml');
      httpRequest.send();
    }

    _makeRequest();
    return output;
  },

  parseTincanXML: function (rawXML, callback) {
    var parseXml;

    if (typeof window.DOMParser != "undefined") {
      parseXml = function (xmlStr) {
        return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
      };
    } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
      parseXml = function (xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
      };
    } else {
      throw new Error("No XML parser found");
    }

    var parsed = parseXml(rawXML);
    console.log('parsed: ', parsed);
    var xmlJSON = app.convertXMLtoJSON(parsed);
    app.xmlJSON = xmlJSON;

    if (xmlJSON) {
      app.launchFile = app.getLaunchFile();

      app.getXMLActivity(function (courseInfo) {
        callback(courseInfo);
      });
    } else {
      callback("");
    }

  },

  getXMLActivityList: function () {
    var xmlJSON = app.xmlJSON;
    var activityVal = xmlJSON && xmlJSON.tincan && xmlJSON.tincan.activities && xmlJSON.tincan.activities.activity;

    var valueIsArray = Array.isArray(activityVal);

    var activityList = activityVal ? (valueIsArray ? activityVal : [activityVal]) : [];
    return activityList;
  },

  getLaunchFile: function () {
    var activityList = this.getXMLActivityList();

    var launchFileAct = activityList.filter(function (act) {
      return act.launch;
    })[0] || {};

    if (!launchFileAct.launch) {
      console.error('Could not find launch file in tincan.xml - using default index_lms.html');
    }

    return launchFileAct.launch || app.launchFile;
  },

  convertXMLtoJSON: function (xml) {
    // Modified version from here: http://davidwalsh.name/convert-xml-json
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    // If just one text node inside
    if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
      obj = xml.childNodes[0].nodeValue;
    } else if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof (obj[nodeName]) == "undefined") {
          obj[nodeName] = app.convertXMLtoJSON(item);
        } else {
          if (typeof (obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(app.convertXMLtoJSON(item));
        }
      }
    }
    return obj;
  },

  getXMLActivity: function (callback) {
    var activityList = this.getXMLActivityList();

    var courseName = "";
    var courseID = "";

    for (var i = 0; i < activityList.length; i++) {
      var thisActivity = activityList[i];
      var thisAttr = thisActivity["@attributes"];
      if (thisAttr.type === "http://adlnet.gov/expapi/activities/course") {
        courseName = thisActivity.name;
        courseID = thisAttr.id;
      }
    }

    var output = {
      courseName: courseName,
      courseID: courseID
    };

    callback(output);
  },

  getStorageKey: function (courseID) {
    return courseID + "/courseRegistration";
  },

  getAgentString: function (queryData) {
    var id = queryData.id;
    var name = queryData.name;
    var email = queryData.email;

    var isValidEmail = email ? app.validateForm(email) : false;

    if (!isValidEmail && !id) {
      alert('Cannot continue without a valid user ID or email.');
      return '';
    }

    if (id) {
      return app.getAccountAgent(id);
    } else {
      return app.getMboxAgent(name, email);
    }
  },

  getMboxAgent: function (name, email) {
    return encodeURIComponent(JSON.stringify({
      name: name,
      mbox: "mailto:" + email,
      objectType: "Agent"
    }));
  },

  getAccountAgent: function (userId) {
    return encodeURIComponent(JSON.stringify({
      account: {
        name: userId,
        homePage: app.query.homePage
      },
      objectType: "Agent"
    }));
  },

  createRegistrationID: function () {
    /* Excerpt from: http://www.broofa.com/Tools/Math.uuid.js (v1.4)
      http://www.broofa.com
      mailto:robert@broofa.com
      Copyright (c) 2010 Robert Kieffer
      Dual licensed under the MIT and GPL licenses.
      */

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == "x" ?
          r :
          (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  validateUsers: function (inputValue) {
    var userList = app.userEmailList();

    var match = userList.filter(function (thisUser) {
      var thisEmail = new RegExp(thisUser, "");
      return thisEmail.test(inputValue);
    });

    if (!match.length) { return false; }

    return true;
  },

  validateForm: function (inputValue) {
    // var emailPattern = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g, "");

    var emailPattern = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

    // var isValid = emailPattern.test(inputValue);
    // console.log('isValid:', isValid);

    // if (!emailPattern.test(inputValue)) { return false; }

    // return true;
    return emailPattern.test(inputValue);
  },

  encodeActivityID: function (activityID) {
    var splitID = activityID.split('://');
    var protocol = splitID[0];
    var originalID = splitID[1];

    var characters = [":", "/"];

    var encoded = originalID;

    for (var i = 0; i < characters.length; i++) {
      var thisChar = characters[i];
      encoded = encoded.replace(thisChar + " ", "-");
      encoded = encoded.replace(thisChar, "-");
    }

    encoded = encoded.replace(/\s/g, "-");

    var output = [protocol, encoded].join('://');
    console.log('output:', output);
    return output;
  },

  showInvalidMessage: function () {
    var errorMessage = "Please check your email, or contact the administrator for help.";
    var loginAlerts = document.getElementById('login-alerts');
    loginAlerts.innerText = errorMessage;
    loginAlerts.classList.remove('hidden');

    var loginBtn = document.getElementById('login-button');
    var resetBtn = document.getElementById('reset-button');

    loginBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
  },

  getDistrictAndFacilityInfo: function (formValues) {
    var districtCode = formValues.district;
    var facilityCode = formValues.facility;

    var facilityInfo = {
      district: {
        code: districtCode,
        name: '',
      }
    };

    var districtData = app.dropdownData.filter(function (district) {
      return district.id === districtCode;
    })[0];

    facilityInfo.district.name = districtData.text;

    if (facilityCode) {
      var facilities = districtData.schools || [];

      var facilityData = facilities.filter(function (facility) {
        return facility.id === facilityCode;
      })[0] || {};

      facilityInfo.facility = {
        code: facilityData.id,
        name: facilityData.text,
        city: facilityData.city,
      };
    }

    for (var radio in app.radioValues) {
      var radVal = app.radioValues[radio];
      var parseJson = (radVal === 'true') || (radVal === 'false');

      facilityInfo[radio] = parseJson ? JSON.parse(radVal) : radVal;
    }

    console.log(JSON.stringify(facilityInfo));

    return facilityInfo;
  },

  getFormValues: function () {
    var formData = $('#login-form').serializeArray();

    var formValues = {};

    [
      'name', 'email',
      'district',
      'facility',
    ].forEach(function (field) {
      var thisField = formData.filter(function (fieldValues) {
        return fieldValues.name === 'login-' + field;
      })[0];

      formValues[field] = thisField ? thisField.value : '';
    });

    return formValues;
  },

  loginUser: function (id, name, email) {
    var formValues = this.getFormValues();

    var userData = {
      id: id,
      name: name || formValues.name || '',
      email: email || formValues.email || '',
    };

    if (app.privateUsers && userData.email) {
      var userIsValid = app.validateUsers(userData.email);

      if (!userIsValid) {
        app.showInvalidMessage();
        return;
      }
    }

    var activity_id = app.encodeActivityID(app.courseID);
    var facilityInfo = app.getDistrictAndFacilityInfo(formValues);

    var grouping = activity_id + '/district/' + facilityInfo.district.code;

    if (facilityInfo.facility) {
      grouping = activity_id + '/facility/' + facilityInfo.facility.code;
    }

    var queryData = {
      agentString: app.getAgentString(userData),
      activity_id: activity_id,
      grouping: grouping,
      facilityInfo: encodeURIComponent(JSON.stringify(facilityInfo)),
    };

    app.queryData = queryData;

    app.assembleQueryAndLaunch();
  },

  getUserInfoFromLrs: function (cb) {
    if (app.query.debug) {
      app.lrs = lrsConfig.debug;
      cb();
      return;
    }

    app.lrs = app.useSandbox ? lrsConfig.sandbox : lrsConfig.prod;

    cb();
  },

  assembleQueryAndLaunch: function () {
    app.getUserInfoFromLrs(function () {
      var qd = app.queryData;

      console.log('qd:', qd);

      var query = "?actor=" + qd.agentString;
      query += "&endpoint=" + encodeURIComponent(app.lrs.endpoint);
      query += "&auth=" + encodeURIComponent(app.lrs.auth);
      query += "&activity_id=" + encodeURIComponent(qd.activity_id);
      query += "&grouping=" + encodeURIComponent(qd.grouping);
      query += "&courseName=" + encodeURIComponent(app.courseName);
      // query += "&registration=" + encodeURIComponent(qd.registration);
      // query += "&profileId=" + encodeURIComponent(app.query.profileId);
      query += "&facilityInfo=" + qd.facilityInfo;

      window.location.href = app.launchFile + query;
    });
  },
};

document.addEventListener("DOMContentLoaded", function () {
  app.init();
});