const axios = require('axios');
const Logger = require('../../../utils/Logger');

const action = async (msisdn, answers, requestID) => {
  const data = {
    "msisdn": answers[0],
    "nationalID": answers[1].toUpperCase(),
    "suuid": answers[2].toUpperCase(),
    "agentID": msisdn,
    "channelID": "ussd",
    "cellID": "",
    "isMFS": 1,
    "confirmed": answers[3],
    "requestID": requestID,
  };

  Logger(`${requestID}|API|bio-re-registration|request|${JSON.stringify(data)}`);

  if (answers[3] !== "1") {
    Logger(`${requestID}|API|bio-re-registration|response|You have cancelled the request. Kindly retry to proceed`);

    return "You have cancelled the request. Kindly retry to proceed"
  }


  const URL = process.env.RE_REGISTRATION_URL;
  const response = await axios.post(URL, data);
  Logger(`${requestID}|API|bio-re-registration|response|${JSON.stringify(response.data)}`);

  return null;
}

module.exports = action;