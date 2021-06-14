const axios = require('axios');

const action = async (msisdn, answers) => {
  const data = {
    "agentID": msisdn,
    "msisdn": answers[1],
    "iccid": answers[2],
    "niaPIN": answers[3],
    "forenames": answers[4],
    "surname": answers[5],
    "gender": answers[6],
    "dateOfBirth": answers[7],
    "isMFS": answers[7] == '1' ? 1 : 0,
    "channelID": "ussd",
  };

  const URL = process.env.REMOTE_REGISTRATION_URL;
  const response = await axios.post(URL, data);

  return null;
}

module.exports = action;