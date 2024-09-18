const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SayaeTokenModule", (m) => {

  const merkleAirdrop = m.contract("SYE");

  return { merkleAirdrop };
});
