function ExecuteScript(strId)
{
  switch (strId)
  {
      case "6ETRn6FZaJd":
        Script1();
        break;
  }
}

function Script1()
{
  customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Focus1",
    "description": "First identification of coaching opportunity"
  },
  "result": {
    "response": GetPlayer().GetVar('Focus1')
  },
  "parent": "LO1",
  "tags": [
    {
      "variablename": "Focus1"
    }
  ]
});
customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Focus2",
    "description": "Second identification of coaching opportunity"
  },
  "result": {
    "response": GetPlayer().GetVar('Focus2')
  },
  "parent": "LO1",
  "tags": [
    {
      "variablename": "Focus2"
    }
  ]
});
customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Focus3",
    "description": "Third identification of coaching opportunity"
  },
  "result": {
    "response": GetPlayer().GetVar('Focus3')
  },
  "parent": "LO1",
  "tags": [
    {
      "variablename": "Focus3"
    }
  ]
});


customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Skills1",
    "description": "First identification of relevant foundational coaching skill"
  },
  "result": {
    "response": GetPlayer().GetVar('Skills1')
  },
  "parent": "LO2",
  "tags": [
    {
      "variablename": "Skills1"
    }
  ]
});
customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Skills2",
    "description": "Second identification of relevant foundational coaching skill"
  },
  "result": {
    "response": GetPlayer().GetVar('Skills2')
  },
  "parent": "LO2",
  "tags": [
    {
      "variablename": "Skills2"
    }
  ]
});
customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "Skills3",
    "description": "Third identification of relevant foundational coaching skill"
  },
  "result": {
    "response": GetPlayer().GetVar('Skills3')
  },
  "parent": "LO2",
  "tags": [
    {
      "variablename": "Skills3"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "LO1sum",
    "description": "Number of correct coaching opportunities identified out of 3"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('LO1sum'),
      "min": 0,
      "max": 3
    }
  },
  "parent": "LO1",
"tags": [
    {
      "variablename": "LO1sum"
    }
  ]
});


customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "LO2sum",
    "description": "Number of correct relevant coaching foundational skills identified out of 3"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('LO2sum'),
      "min": 0,
      "max": 3
    }
  },
  "parent": "LO2",
"tags": [
    {
      "variablename": "LO2sum"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "LO1dash",
    "description": "Dashboard variable for LO1"
  },
  "result": {
    "response": GetPlayer().GetVar('LO1dash')
  },
  "parent": "LO1",
"tags": [
    {
      "variablename": "LO1dash"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "answered",
  "activity": {
    "name": "LO2dash",
    "description": "Dashboard variable for LO2"
  },
  "result": {
    "response": GetPlayer().GetVar('LO2dash')
  },
  "parent": "LO2",
"tags": [
    {
      "variablename": "LO2dash"
    }
  ]
});
}

