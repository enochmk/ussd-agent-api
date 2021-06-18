const axios = require('axios');
const Logger = require('../../../utils/Logger');

const action = async (agentID, answers, requestID = null) => {
  const data = {
    "msisdn": answers[0],
    "iccid": answers[1],
    "nationalID": answers[2].toUpperCase(),
    "suuid": answers[3],
    "agentID": agentID,
    "channelID": "ussd",
    "cellID": "",
    "isMFS": 1,
    "confirmed": answers[4],
    "requestID": requestID,

  };

  Logger(`${requestID}|${agentID}|API|bio-registration|request|${JSON.stringify(data)}`);

  if (answers[4] !== "1") {
    Logger(`${requestID}|API|bio-registration|response|You have cancelled the request. Kindly retry to proceed`);
    return "You have cancelled the request. Kindly retry to proceed"
  }

  const URL = process.env.REGISTRATION_URL;
  const response = await axios.post(URL, data);
  Logger(`${requestID}|${agentID}|API|bio-registration|response|${JSON.stringify(response.data)}`);

  return null;
}

module.exports = action;