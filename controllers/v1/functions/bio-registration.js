const axios = require('axios');

const action = async (msisdn, answers) => {
  if (answers[5] !== "1") {
    return "You have cancelled the request. Kindly retry to proceed"
  }

  const data = {
    "msisdn": answers[1],
    "iccid": answers[2],
    "nationalID": answers[3],
    "suuid": answers[4],
    "agentID": msisdn,
    "channelID": "ussd",
    "cellID": "",
    "isMFS": 1
  };

  const URL = process.env.REGISTRATION_URL;
  const response = await axios.post(URL, data);

  return null;
}

module.exports = action;