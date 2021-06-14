const axios = require('axios');

const action = async (msisdn, inputs) => {
  // Confirm is not equal to 1;
  if (inputs[4] !== '1') {
    return "You have cancelled the request. Kindly retry to proceed. Thank you"
  }

  const data = {
    "msisdn": inputs[1],
    "nationalID": inputs[2],
    "suuid": inputs[3],
    "agentID": msisdn,
    "channelID": "ussd",
    "cellID": "",
    "isMFS": 1
  };

  const URL = process.env.RE_REGISTRATION_URL;
  const response = await axios.post(URL, data);

  return null;
}

module.exports = action;