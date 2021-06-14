const axios = require('axios');

const action = async (agentID, answers) => {
  const customerMSISDN = answers[1];

  const URL = `http://10.81.1.124:89/simreg_agent/index.php?agent_msisdn=${agentID}&msisdn=${customerMSISDN}&ops=simReg`;

  const response = await axios.get(URL);

  return response.data;
}

module.exports = action;