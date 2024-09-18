const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BaycGatedContractModule", (m) => {

  const BaycGatedMerkleAirdrop = m.contract("BaycGatedMerkleAirdrop");

  return { BaycGatedMerkleAirdrop };
});
