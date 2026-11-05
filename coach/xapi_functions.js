console.log('STORYLINE: script running | Version 10');
console.log('MiMTSS | updated July 29, 2020');

var customxAPI = {
  init: function () {
    if (window.TinCan) {
      window.xapi = new TinCan();
      window.xapi.init({ url: window.location.href });

      console.log('customxAPI initialized');
      customxAPI.queryParams = TinCan.Utils.parseURL(window.location.href).params;
      customxAPI.rootURL = window.xapi.activity.id + "/";

      customxAPI.sendAdditionalFields();

      setTimeout(customxAPI.trackResources, 3000);
    } else {
      console.warn('TinCan not available');
    }
  },

  flattenAdditionalFields: function (obj) {
    var flatObj = {};

    for (var prop in obj) {
      var value = obj[prop];

      var valIsBool = value === true || value === false;

      if (valIsBool) {
        value = value === true ? 'Yes' : 'No';
      }

      if (typeof value == 'object') {
        for (var subProp in value) {
          // var camelProp = customxAPI.camelCasify(prop, subProp);
          var camelProp = customxAPI.encodeID(prop + ' ' + subProp);
          flatObj[camelProp] = value[subProp];
        }
      } else {
        flatObj[prop] = value;
      }

      if (!value) { continue; }
    }

    return flatObj;
  },


  sendAdditionalFields: function () {
    var query = customxAPI.queryParams;
    var facilityInfo = query.facilityInfo || null;
    customxAPI.additionalFields = {};

    if (!facilityInfo) { return; }

    try {
      if (typeof facilityInfo == "string") {
        facilityInfo = JSON.parse(facilityInfo);
      }

      var parsedActor = JSON.parse(query.actor);
      var actor = new TinCan.Agent(parsedActor);
      var rootActivityId = query.activity_id;

      function sendStmt(prop, value) {
        var activityName = value;

        var displayProp = customxAPI.urlifyReverse(prop);

        var stmt = {
          verb: 'selected',

          activity: {
            id: prop + '/' + customxAPI.encodeID(value),
            name: activityName,
            description: prop + ' | ' + value,
          },

          // verb: 'answered',

          // activity: {
          //   id: prop,
          //   name: displayProp,
          //   description: displayProp,
          // },

          result: {
            response: activityName,
          }
        }

        customxAPI.sendStatement(stmt);
      }

      customxAPI.additionalFields = customxAPI.flattenAdditionalFields(facilityInfo);

      for (var prop in customxAPI.additionalFields) {
        var value = customxAPI.additionalFields[prop];

        if (!value) { continue; }

        sendStmt(prop, value);
      }
    } catch (ex) {
      console.error('ex getting facilityInfo:', ex);
    }
  },

  saveAgentProfileVariables: function (profileId, variablesToSave) {
    var profileOutput = {};
    var player = window.GetPlayer && window.GetPlayer();

    variablesToSave.forEach(function (varName) {
      var varValue = player && player.GetVar(varName);

      if (varValue) {
        profileOutput[varName] = varValue;
      }
    });

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === xhr.DONE) {
        var status = xhr.status;

        if (status === 0 || (status >= 200 && status < 400)) {
          console.log(status + ' | ' + (xhr.responseText || 'Profile variables saved.'));
        } else {
          console.error('profile error - status:', xhr);
        }
      }
    }

    var xapiLrs = xapi.recordStores[0];
    var actor = window.xapi.actor;

    var profileUrl = xapiLrs.endpoint + 'agents/profile';
    profileUrl += '?profileId=' + profileId;

    var agent = {
      objectType: "Agent",
      mbox: actor.mbox,
    };

    if (actor.name) {
      agent.name = actor.name;
    }

    var encodedAgent = encodeURIComponent(JSON.stringify(agent));

    profileUrl += '&agent=' + encodedAgent;

    xhr.open('post', profileUrl);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', xapiLrs.auth);
    xhr.setRequestHeader("X-Experience-API-Version", "1.0.0");

    xhr.send(JSON.stringify(profileOutput));

  },

  trackResources: function () {
    console.log('trackResources started....');
    $('.resource').on('click', function () {
      var resourceName = this.innerText.trim();
      var resourceAnchor = $(this).find('a')[0];
      var resourceLink = resourceAnchor.href;
      var resourceIcon = $(resourceAnchor).find('img')[0].src;

      var resourceType = 'attachment';
      var fileType = 'unknown';
      var activityType = 'document';

      if (resourceIcon.indexOf('url') > -1) {
        resourceType = 'url';
      }

      if (/\.(?:jpg|jpeg|gif|png|tif)$/i.test(resourceLink)) {
        fileType = 'image';
      } else if (/\.(?:mov|mp4|wmv|avi)$/i.test(resourceLink)) {
        fileType = activityType = 'video';
      } else if (/\.(?:pdf)$/i.test(resourceLink)) {
        fileType = 'pdf';
      } else if (/\.(?:doc|docx|txt)$/i.test(resourceLink)) {
        fileType = 'document';
      } else if (/\.(?:xls|xlsx|csv)$/i.test(resourceLink)) {
        fileType = 'spreadsheet';
      } else if (/\.(?:ppt|pptx)$/i.test(resourceLink)) {
        fileType = 'presentation';
      }

      customxAPI.sendStatement({
        "verb": "viewed",
        "activity": {
          "name": resourceName,
          "description": customxAPI.getFileNameFromLink(resourceLink),
          "type": activityType
        },
        "parent": "course",
        "tags": [
          { "resourceType": resourceType },
          { "fileType": fileType }
        ]
      });

    });
  },

  getFileNameFromLink: function (link) {
    var googleDocViewer = 'https://docs.google.com/viewer?url=';
    if (link.indexOf(googleDocViewer) > -1) {
      console.log('has google link')
      link = decodeURIComponent(link.replace(googleDocViewer, ""));
    }

    console.log('link (converted):', link);

    var splitLink = link.split('/');
    return decodeURIComponent(splitLink[splitLink.length - 1]);
  },

  getVideoElement: function () {
    setTimeout(function () {
      var video = document.getElementsByTagName('video')[0];
      if (video) {
        customxAPI.currentVideo = video;
        console.log('current video:', video);
      }
    }, 1000);
    console.log('getting video...');
  },

  detectSlideChange: function () {
    var oldReactID = "";

    function getReactID() {
      var slideData = $('.slide-transition-container').data();
      var reactID = slideData ? slideData.reactid : "";
      if (reactID && oldReactID !== reactID) {
        console.log('<> slide navigation');
        var video = document.getElementsByTagName('video')[0];
        if (video) {
          console.log('<> video on page: ', video.src);
        }
      }
      oldReactID = reactID;
    }

    var checkReactID = setInterval(getReactID, 1000);
  },

  getVerb: function (display) {
    var thisVerbID = customxAPI.verbMap[display] || 'http://adlnet.gov/expapi/verbs/' + display;
    return {
      id: thisVerbID,
      display: {
        "en-US": display
      }
    };
  },

  getActivity: function (actObj, type, video) {
    if (typeof actObj === 'string') {
      actObj = {
        name: actObj
      };
    }
    var thisID = actObj.id || customxAPI.encodeID(actObj.name);

    var output = {
      id: customxAPI.rootURL + thisID,
      definition: {
        name: {
          "en-US": actObj.name
        },
        description: {
          "en-US": actObj.description || ""
        }
      }
    };

    if (type) {
      output.definition.type = customxAPI.activityTypeMap[type] || "";

      // var video = document.getElementsByTagName('video')[0];
      if (type === 'video' && video) {
        console.log('adding video extension to activity:', video);
        var duration = video.duration || "";
        output.definition.extensions = {
          "http://id.tincanapi.com/extension/duration": duration
        };
        output.definition.extensions[customxAPI.rootURL + 'activities/extension/label'] = $('video').closest('.slide-object-video').attr('aria-label')
      }
    }

    return output;
  },

  getResult: function (thisResult) {
    var resultObj = {};

    var props = ["score", "response", "success", "completion", "duration"];

    for (var i = 0; i < props.length; i++) {
      var thisProp = props[i];
      if (thisResult[thisProp]) {
        if (thisProp === "duration" && thisResult.duration) {
          var thisDuration = TinCan.Utils.convertMillisecondsToISO8601Duration(thisResult.duration);
          resultObj.duration = thisDuration;
        } else if (thisProp === "score" && thisResult.score) {
          resultObj.score = {};
          var subProps = ["raw", "min", "max", "scaled"];
          for (var x = 0; x < subProps.length; x++) {
            var thisSubProp = subProps[x];
            if (thisResult.score[thisSubProp] || thisResult.score[thisSubProp] === 0) {
              resultObj.score[thisSubProp] = thisResult.score[thisSubProp];
            }
          }
        } else if (thisProp === "response" && thisResult.response) {
          resultObj[thisProp] = "" + thisResult[thisProp]; // must be a string
        } else {
          resultObj[thisProp] = thisResult[thisProp];
        }
      }
    }

    return resultObj;
  },

  getVideoResult: function (video) {
    if (!video) { return; }
    var output = "";
    // var video = document.getElementsByTagName('video')[0];

    var currentTime = video.currentTime;
    var totalTime = video.duration;

    output = {
      duration: "PT" + Math.round(currentTime) + "S",
      extensions: {
        "http://id.tincanapi.com/extension/starting-point": 0,
        "http://id.tincanapi.com/extension/ending-point": currentTime
      }
    };

    console.log('video output:', output);

    return output;
  },

  createCtxtActivity: function (activity) {
    return {
      id: customxAPI.rootURL + customxAPI.encodeID(activity),
      definition: {
        name: {
          "en-US": activity
        }
      }
    };
  },

  getParent: function (stmt) {
    var parentObj = customxAPI.createCtxtActivity(stmt.parent);

    return [parentObj];
  },

  getGrouping: function (stmt) {
    var groupArray = [];

    if (stmt.grouping && stmt.grouping.length) {
      for (var i = 0; i < stmt.grouping.length; i++) {
        groupArray.push(customxAPI.createCtxtActivity(stmt.grouping[i]));
      }
    }

    var facilityInfo = customxAPI.additionalFields;

    if (facilityInfo) {
      try {
        for (var type in facilityInfo) {
          var activityName = facilityInfo[type] || '';

          var thisGroup = {
            id: customxAPI.rootURL + type + '/' + customxAPI.encodeID(activityName),
            definition: {
              name: {
                "en-US": activityName
              },
              description: {
                "en-US": customxAPI.urlifyReverse(type) + ' | ' + activityName
              }
            }
          }

          groupArray.push(thisGroup);
        }
      } catch (error) {
        console.error('error:', error);
      }
    }

    return groupArray;
  },

  getVideoCategory: function () {
    return [{
      id: "http://id.tincanapi.com/recipe/video/base/1",
      definition: {
        type: "http://id.tincanapi.com/activitytype/recipe",
        name: {
          "en-US": "Recipe: Video Base (v1)"
        },
        description: {
          "en-US": "A base recipe for recording video experiences. (v1)"
        }
      }
    }];
  },

  getExtensions: function (stmt) {
    var output = {};
    for (var i = 0; i < stmt.tags.length; i++) {
      var thisTag = stmt.tags[i];
      var thisTagKey = Object.getOwnPropertyNames(thisTag)[0];
      var thisID = customxAPI.rootURL + "extensions/" + customxAPI.encodeID(thisTagKey);
      output[thisID] = thisTag[thisTagKey];
    }

    return output;
  },

  stmtCallback: function (response) {
    var res = response[0];
    if (res.err) {
      if (res.xhr) {
        console.error("Failed to save statement: " + res.xhr.responseText + " (" + res.xhr.status + ")");
        return;
      }

      console.error("Failed to save statement: " + res.err);
      return;
    }

    console.log("Statement saved");
  },

  sendStatement: function (stmt) {
    var video = document.getElementsByTagName('video')[0];
    var stmtObj = {
      verb: customxAPI.getVerb(stmt.verb),
      target: customxAPI.getActivity(stmt.activity, stmt.activity.type, (customxAPI.currentVideo || video || ""))
    };

    if (stmt.result) {
      stmtObj.result = customxAPI.getResult(stmt.result);
    }

    if (stmt.activity.type) {
      if (stmt.activity.type === 'video') {
        try {
          stmtObj.result = customxAPI.getVideoResult(customxAPI.currentVideo || video);
        } catch (ex) {
          console.error('video not found?', customxAPI.currentVideo);
        }
      }
    }

    // if (stmt.parent || stmt.grouping) {
    var courseActivityArray = [{ id: window.xapi.activity.id }];

    stmtObj.context = {
      contextActivities: {}
    };

    if (stmt.parent) {
      if (stmt.parent === 'course') {
        stmtObj.context.contextActivities.parent = courseActivityArray;
      } else {
        stmtObj.context.contextActivities.parent = customxAPI.getParent(stmt);
      }
    }

    // if (stmt.grouping) {
    stmtObj.context.contextActivities.grouping = courseActivityArray.concat(customxAPI.getGrouping(stmt));
    // }

    if (stmt.activity.type && stmt.activity.type === 'video') {
      stmtObj.context.contextActivities.category = customxAPI.getVideoCategory();
    }
    // }



    if (stmt.tags) {
      stmtObj.context = stmtObj.context || {};
      stmtObj.context.extensions = customxAPI.getExtensions(stmt);
    }

    var statement = new TinCan.Statement(stmtObj);

    customxAPI.currentVideo = "";

    window.xapi.sendStatement(statement, customxAPI.stmtCallback);
  },

  stateCfg: {
    contentType: 'application/json',
    registration: null,
    activity: { id: "" }
  },

  setGlobalVariableCallback: function (err, response) {
    if (err) {
      console.error(err);
      return;
    }
    if (response) {
      console.log('state response:', response.status);
    }
  },

  setGlobalVariable: function (variable) {
    customxAPI.stateCfg.activity.id = variable.globalID;
    customxAPI.stateCfg.callback = customxAPI.setGlobalVariableCallback;
    console.log("setting: ", variable.name, variable.value)
    window.xapi.setState(variable.name, { value: variable.value }, customxAPI.stateCfg);
  },

  clearGlobalVariable: function (variable) {
    function _callback(err, response) {
      console.log("callback", err, response)
    }
    customxAPI.stateCfg.activity.id = variable.globalID;
    customxAPI.stateCfg.callback = _callback;
    window.xapi.deleteState(variable.name, customxAPI.stateCfg);
  },

  getGlobalVariable: function (variable) {
    GetPlayer().SetVar('Name', xapi.actor.name);
    var thisVar = {};
    function _callback(err, response) {
      if (err) {
        console.error(err);
        return;
      }
      if (response && response.contents) {
        thisVar = response.contents;
        console.log('thisVar (from state contents):', thisVar);
        GetPlayer().SetVar(variable.name, thisVar.value);
        if (variable.name === 'persona') {
          GetPlayer().SetVar('PersonaChecked', true);
        }
      } else {
        console.log('No state contents for ', variable.name);
        if (variable.name === 'persona') {
          GetPlayer().SetVar('persona', 'choosing');
          setTimeout(function () {
            GetPlayer().SetVar('PersonaChecked', true);
          }, 250);

        }
      }
    }

    customxAPI.stateCfg.activity.id = variable.globalID;
    customxAPI.stateCfg.callback = _callback;
    window.xapi.getState(variable.name, customxAPI.stateCfg);
  },

  encodeID: function (text) {
    text = text || "";
    return encodeURIComponent(text.replace(/\s/g, '-').toLowerCase()).replace(/[!'()*]/g, "");
  },

  urlifyReverse: function (text) {
    if (!text || typeof text != 'string') {
      return '';
    }

    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, function (l) { return l.toUpperCase() });

  },

  camelCasify: function (first, second) {
    first = (first && first.toString()) || '';
    second = (second && second.toString()) || '';

    if (!first) {
      return second.toLowerCase();
    }

    var cappedSecond = second.charAt(0).toUpperCase() + (second.substring(1) || '').toLowerCase();
    return first.toLowerCase() + cappedSecond;
  },

  camelCasifyReverse: function (text) {
    text = (text && text.toString()) || '';

    var result = text.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  },

  verbMap: {
    "experienced": "http://adlnet.gov/expapi/verbs/experienced",
    "answered": "http://adlnet.gov/expapi/verbs/answered",
    "completed": "http://adlnet.gov/expapi/verbs/completed",
    "passed": "http://adlnet.gov/expapi/verbs/passed",
    "failed": "http://adlnet.gov/expapi/verbs/failed",

    "watched": "http://activitystrea.ms/schema/1.0/watch",
    "paused": "http://id.tincanapi.com/verb/paused",
    "played": "http://activitystrea.ms/schema/1.0/play",

    "rated": "http://id.tincanapi.com/verb/rated",
    "viewed": "http://id.tincanapi.com/verb/viewed",
    "downloaded": "http://id.tincanapi.com/verb/downloaded",

    "attended": "http://adlnet.gov/expapi/verbs/attended",
    "attempted": "http://adlnet.gov/expapi/verbs/attempted",
    "interacted": "http://adlnet.gov/expapi/verbs/interacted",
    "imported": "http://adlnet.gov/expapi/verbs/imported",
    "created": "http://adlnet.gov/expapi/verbs/created",
    "shared": "http://adlnet.gov/expapi/verbs/shared",
    "voided": "http://adlnet.gov/expapi/verbs/voided",

    "asked": "http://adlnet.gov/expapi/verbs/asked",
    "commented": "http://adlnet.gov/expapi/verbs/commented",
    "exited": "http://adlnet.gov/expapi/verbs/exited",
    "initialized": "http://adlnet.gov/expapi/verbs/initialized",
    "launched": "http://adlnet.gov/expapi/verbs/launched",
    "mastered": "http://adlnet.gov/expapi/verbs/mastered",
    "preferred": "http://adlnet.gov/expapi/verbs/preferred",
    "progressed": "http://adlnet.gov/expapi/verbs/progressed",
    "registered": "http://adlnet.gov/expapi/verbs/registered",
    "responded": "http://adlnet.gov/expapi/verbs/responded",
    "resumed": "http://adlnet.gov/expapi/verbs/resumed",
    "scored": "http://adlnet.gov/expapi/verbs/scored",
    "selected": "http://id.tincanapi.com/verb/selected",
    "shared": "http://adlnet.gov/expapi/verbs/shared",
    "suspended": "http://adlnet.gov/expapi/verbs/suspended",
    "terminated": "http://adlnet.gov/expapi/verbs/terminated"

  },

  activityTypeMap: {
    "note": "http://activitystrea.ms/schema/1.0/note",
    "assessment": "http://adlnet.gov/expapi/activities/assessment",
    "question": "http://adlnet.gov/expapi/activities/question",
    "video": "http://activitystrea.ms/schema/1.0/video",
    "document": "http://id.tincanapi.com/activitytype/document",
    "scenario": "http://id.tincanapi.com/activitytype/scenario",
    "course": "http://adlnet.gov/expapi/activities/course",
    "module": "http://adlnet.gov/expapi/activities/module",
    "interaction": "http://adlnet.gov/expapi/activities/interaction",
    "meeting": "http://adlnet.gov/expapi/activities/meeting",
    "objective": "http://adlnet.gov/expapi/activities/objective",
    "simulation": "http://adlnet.gov/expapi/activities/simulation",
    "performance": "http://adlnet.gov/expapi/activities/performance"
  }
}

window.customxAPI = customxAPI;
function loadScriptSync(id, src, cb) {
  if (document.getElementById(id)) {
    console.log('Script already loaded');
    return;
  }
  var s = document.createElement('script');
  s.src = src;
  s.id = id;
  s.type = "text/javascript";
  s.async = false;
  document.body.appendChild(s);
  s.onload = function (e) {
    console.log(id + ' loaded:', src);
    if (cb) { cb(); }
  }
}
function _addTinCanScript(cb) {
  var tincanScript = '//cdn.jsdelivr.net/npm/tincanjs@0.50.0/build/tincan-min.js';
  var id = 'tincan-script';
  loadScriptSync(id, tincanScript, cb);
}
function _addJqueryScript(cb) {
  var jQueryScript = '//code.jquery.com/jquery-3.4.1.slim.min.js';
  var id = 'jquery-script';
  loadScriptSync(id, jQueryScript, cb);
}
var tinCanLoaded = window.TinCan;
var jQueryLoaded = window.jQuery;
var bothLoaded = tinCanLoaded && jQueryLoaded;
var neitherLoaded = !bothLoaded;
if (bothLoaded) {
  window.customxAPI.init();
} else {
  if (tinCanLoaded && !jQueryLoaded) {
    _addJqueryScript(window.customxAPI.init);
  } else if (!tinCanLoaded && jQueryLoaded) {
    _addTinCanScript(window.customxAPI.init);
  } else if (neitherLoaded) {
    _addTinCanScript(function () {
      _addJqueryScript(window.customxAPI.init);
    });
  }
}