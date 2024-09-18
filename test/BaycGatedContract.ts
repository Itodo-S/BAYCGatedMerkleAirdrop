import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaycGatedMerkleAirdrop, SYE } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { MockERC721 } from "@openzeppelin/contracts/mocks/MockERC721.sol";

describe("BaycGatedMerkleAirdrop", function () {
  let baycGatedMerkleAirdrop: BaycGatedMerkleAirdrop;
  let token: SYE;
  let baycNft: MockERC721;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let merkleTree: MerkleTree;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy SYE token
    const SYEToken = await ethers.getContractFactory("SYE");
    token = await SYEToken.deploy();

    // Deploy mock BAYC NFT using OpenZeppelin's MockERC721
    const MockBAYC = await ethers.getContractFactory("MockERC721");
    baycNft = await MockBAYC.deploy("Bored Ape Yacht Club", "BAYC");

    // Create merkle tree
    const leaves = [
      { address: user1.address, amount: ethers.utils.parseEther("100") },
      { address: user2.address, amount: ethers.utils.parseEther("200") },
    ].map((x) => ethers.utils.solidityKeccak256(["address", "uint256"], [x.address, x.amount]));

    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getHexRoot();

    // Deploy BaycGatedMerkleAirdrop contract
    const BaycGatedMerkleAirdrop = await ethers.getContractFactory("BaycGatedMerkleAirdrop");
    baycGatedMerkleAirdrop = await BaycGatedMerkleAirdrop.deploy(token.address, baycNft.address, merkleRoot);

    // Mint tokens to the airdrop contract
    await token.connect(owner).mint(ethers.utils.parseEther("1000"));
    await token.connect(owner).transfer(baycGatedMerkleAirdrop.address, ethers.utils.parseEther("1000"));

    // Mint BAYC NFT to user1
    await baycNft.mint(user1.address, 1);
  });

  it("should allow a user who owns BAYC and has valid Merkle proof to claim airdrop", async function () {
    const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [user1.address, ethers.utils.parseEther("100")]);
    const proof = merkleTree.getHexProof(leaf);

    await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(ethers.utils.parseEther("100"), proof))
      .to.emit(baycGatedMerkleAirdrop, "AirdropClaimed")
      .withArgs(user1.address, ethers.utils.parseEther("100"));

    expect(await token.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("should not allow a user without BAYC to claim airdrop", async function () {
    const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [user2.address, ethers.utils.parseEther("200")]);
    const proof = merkleTree.getHexProof(leaf);

    await expect(baycGatedMerkleAirdrop.connect(user2).claimAirdrop(ethers.utils.parseEther("200"), proof))
      .to.be.revertedWith("Must own a BAYC NFT to claim");
  });

  it("should not allow a user to claim twice", async function () {
    const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [user1.address, ethers.utils.parseEther("100")]);
    const proof = merkleTree.getHexProof(leaf);

    await expect(baycGatedMerkleAirdrop.connect(user1).claimAirdrop(ethers.utils.parseEther("100"), proof))
      .to.be.revertedWith("Airdrop already claimed.");
  });

});
