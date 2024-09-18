import { ethers } from "hardhat";
import { expect } from "chai";
import { BaycGatedMerkleAirdrop, SYE } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
// import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/signers";
import keccak256 from "keccak256";
// import { MockERC721 } from "../typechain-types/MockERC721";
import { generateRootHash, getProof } from "../merkle";
import { loadFixture,  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("BaycGatedContract", function () {
  let baycGatedMerkleAirdrop: BaycGatedMerkleAirdrop;
  let token: SYE;
  let merkleTree: MerkleTree;

  async function deployToken() {
    const SYE = await ethers.getContractFactory("SYE");
    token = await SYE.deploy();
    return token;
  }
  async function deployNFT() {
    const token = await deployToken();
    const baycAddress = "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69";
    const rootHash = await generateRootHash();
    const MockBAYC = await ethers.getContractFactory("BaycGatedMerkleAirdrop");
    baycGatedMerkleAirdrop = await MockBAYC.deploy(token, baycAddress, rootHash);
    const signer = await ethers.getSigners();
    const [user1, user2]= signer;
    return { baycGatedMerkleAirdrop, token, baycAddress, rootHash, user1, user2 };
  }

  it("should deploy contracts", async function () {
    const { baycGatedMerkleAirdrop, token, baycAddress, rootHash } = await deployNFT();
    expect(baycGatedMerkleAirdrop).to.exist;
    expect(token).to.exist;
    expect(baycAddress).to.exist;
    expect(rootHash).to.exist;
  });


  it("Should deploy with the correct parameters", async function () {
    const { baycGatedMerkleAirdrop, token, baycAddress, rootHash } = await loadFixture(deployNFT);
    expect(await baycGatedMerkleAirdrop.token()).to.equal( token.target);
    expect(await baycGatedMerkleAirdrop.baycNft()).to.equal(baycAddress);
    expect(await baycGatedMerkleAirdrop.merkleRoot()).to.equal(rootHash);
  });


    it('Should allow eligible user to claim airdrop', async function () {
    const { baycGatedMerkleAirdrop, token, baycAddress, rootHash, user1 } = await loadFixture(deployNFT);
    // Define the address of the token holder.
    const TOKEN_HOLDER = "0xaAa2DA255DF9Ee74C7075bCB6D81f97940908A5D";
    const BAYC_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

    const amount = ethers.parseEther("100.0").toString();
    const proof = await getProof(TOKEN_HOLDER, amount);

    // Impersonate the token holder account to perform actions on their behalf.
    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const BAYC_Contract = await ethers.getContractAt("IERC721", BAYC_ADDRESS, impersonatedSigner);        

    console.log("BAYC Wallet Balance: "+ await BAYC_Contract.balanceOf(TOKEN_HOLDER));
        await baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, proof);
    console.log("Token transfer completed");

    // Check if the user has received the token
    expect(await token.balanceOf(TOKEN_HOLDER)).to.equal(amount);
  });

//   it("Should not allow ineligible user to claim airdrop", async function () {
//     const { baycGatedMerkleAirdrop, token, baycAddress, rootHash, user1 } = await loadFixture(deployNFT);
//     const TOKEN_HOLDER = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
//     const amount = ethers.parseEther("100.0").toString();
//     const proof = await getProof(TOKEN_HOLDER, amount);

//     await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, proof)).to.be.revertedWith("Must own a BAYC NFT");
//     });

//     it("Should not allow double claiming", async function () {
//       const { baycGatedMerkleAirdrop, token, baycAddress, rootHash } = await loadFixture(deployNFT);
//       const TOKEN_HOLDER = "0xaAa2DA255DF9Ee74C7075bCB6D81f97940908A5D";
//       const amount = ethers.parseEther("100.0").toString();
//       const proof = await getProof(TOKEN_HOLDER, amount);

//       await baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, proof);
//       await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, proof)).to.be.revertedWith("Airdrop already claimed");
//     });

//     it("Should not allow claiming with invalid proof", async function () {
//       const { baycGatedMerkleAirdrop, token, baycAddress, rootHash } = await loadFixture(deployNFT);
//       const TOKEN_HOLDER = "0xe2A83b15FC300D8457eB9E176f98d92a8FF40a49";
//       const amount = ethers.parseEther("100.0").toString();
//       const invalidProof = await getProof(TOKEN_HOLDER, amount);

//       await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, invalidProof)).to.be.revertedWith("Invalid Merkle Proof");
//     });

//     it("Should not allow claiming with zero address", async function () {
//         const { baycGatedMerkleAirdrop, token, baycAddress, rootHash } = await loadFixture(deployNFT);
//       const TOKEN_HOLDER = "0x0000000000000000000000000000000000000000";
//       const amount = ethers.parseEther("100.0").toString();
//     const proof = await getProof(TOKEN_HOLDER, amount);

//     await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(TOKEN_HOLDER,amount, proof)).to.be.revertedWith("Invalid address: zero address");
//     });
})