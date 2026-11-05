function ExecuteScript(strId)
{
  switch (strId)
  {
      case "6EOJGKiHOC1":
        Script1();
        break;
  }
}

function Script1()
{
  customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Post-test positive responses within staff control (PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('controlpositivepost')
   }},
  "tags": [
    {
      "variableName": "controlpositivepost"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Post-test punitive responses within staff control (not PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('controlpunitivepost')
   }},
  "tags": [
    {
      "variableName": "controlpunitivepost"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Post-test responses outside of staff control (not PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('nocontrolpost')
    }},
  "tags": [
    {
      "variableName": "nocontrolpost"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Pre-test positive responses within staff control (PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('controlpositivepre')
    }},
  "tags": [
    {
      "variableName": "controlpositivepre"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Pre-test punitive responses within staff control (not PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('controlpunitivepre')
   }},
  "tags": [
    {
      "variableName": "controlpunitivepre"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Pre-test responses outside of staff control (not PBIS friendly)",
    "description": "Response tendency in reaction to behavioral issues: scores represent average rank order from 1st choice to 6th choice, where 1=1st choice"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('nocontrolpre')
      }},
  "tags": [
    {
      "variableName": "nocontrolpre"
    }
  ]
});

customxAPI.sendStatement({
  "verb": "responded",
  "activity": {
    "name": "Difference between pre-test and post-test positive responses within staff control (PBIS friendly)",
    "description": "Scores represent difference in rank order from 1st choice to 6th choice. Positive scores indicate that rank order moved closer to 1st place, while negative scores indicate that rank order moved closer to 6th place. A score of one indicates that after eLearning, the likelihood of positive responses to behavioral issues increased by one rank order (for example, from 3rd to 2nd place)"
  },
  "result": {
    "score": {
      "raw": GetPlayer().GetVar('responsedifference')
   }},
  "tags": [
    {
      "variableName": "responsedifference"
    }
  ]
});

}

