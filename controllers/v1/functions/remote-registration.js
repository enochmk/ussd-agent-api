const axios = require('axios');
const Logger = require('../../../utils/Logger');

const action = async (msisdn, answers, requestID = null) => {
  const data = {
    "agentID": msisdn,
    "msisdn": answers[0],
    "iccid": answers[1],
    "niaPIN": answers[2].toUpperCase(),
    "forenames": answers[3].toUpperCase(),
    "surname": answers[4].toUpperCase(),
    "gender": answers[5],
    "dateOfBirth": answers[6],
    "isMFS": answers[7] == '1' ? 1 : 0,
    "channelID": "ussd",
    "requestID": requestID,

  };

  Logger(`${requestID}|API|remote-registration|request|${JSON.stringify(data)}`);

  const URL = process.env.REMOTE_REGISTRATION_URL;
  const response = await axios.post(URL, data);

  Logger(`${requestID}|API|remote-registration|response|${JSON.stringify(response.data)}`);

  return null;
}

module.exports = action;