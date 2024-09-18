const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { parseEther } = ethers;

describe("BaycGatedMerkleAirdrop", function () {
  let airdropContract;
  let token;
  let baycNft;
  let owner;
  let user1;
  let user2;
  let merkleTree;
  let merkleRoot;
  let leafNodes;
  let claimAmount = parseEther("100");

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy ERC20 token
    const ERC20Token = await ethers.getContractFactory("SYE");
    token = await ERC20Token.deploy("Sayae", "SYE");
    await token.deployed();

    // Deploy Mock BAYC NFT
    const MockBAYCNFT = await ethers.getContractFactory("ERC721PresetMinterPauserAutoId");
    baycNft = await MockBAYCNFT.deploy("BAYC NFT", "BAYC", "https://testnft.com/");
    await baycNft.deployed();

    // Mint a BAYC NFT to user1
    await baycNft.mint(user1.address);

    // Mint tokens to the airdrop contract
    await token.mint(owner.address, parseEther("1000"));

    // Prepare Merkle Tree
    const claimers = [
      { address: user1.address, amount: claimAmount },
    ];

    leafNodes = claimers.map(({ address, amount }) =>
      keccak256(ethers.utils.solidityPack(["address", "uint256"], [address, amount]))
    );

    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy the airdrop contract
    const BaycGatedMerkleAirdrop = await ethers.getContractFactory("BaycGatedMerkleAirdrop");
    airdropContract = await BaycGatedMerkleAirdrop.deploy(token.address, baycNft.address, merkleRoot);
    await airdropContract.deployed();

    // Transfer some tokens to the airdrop contract
    await token.transfer(airdropContract.address, parseEther("500"));
  });

  it("should allow a user who owns BAYC and has valid Merkle proof to claim airdrop", async function () {
    const leaf = keccak256(ethers.utils.solidityPack(
      ["address", "uint256"],
      [user1.address, claimAmount]
    ));

    const merkleProof = merkleTree.getHexProof(leaf);

    // user1 should not have claimed yet
    expect(await airdropContract.hasClaimed(user1.address)).to.be.false;

    // Claim the airdrop
    await expect(
      airdropContract.connect(user1).claimAirdrop(claimAmount, merkleProof)
    ).to.emit(airdropContract, "AirdropClaimed")
      .withArgs(user1.address, claimAmount);

    // user1 should have claimed now
    expect(await airdropContract.hasClaimed(user1.address)).to.be.true;

    // Check that the token balance is updated
    const user1Balance = await token.balanceOf(user1.address);
    expect(user1Balance).to.equal(claimAmount);
  });

  it("should not allow the same user to claim airdrop twice", async function () {
    const leaf = keccak256(ethers.utils.solidityPack(
      ["address", "uint256"],
      [user1.address, claimAmount]
    ));

    const merkleProof = merkleTree.getHexProof(leaf);

    // Attempt to claim again
    await expect(
      airdropContract.connect(user1).claimAirdrop(claimAmount, merkleProof)
    ).to.be.revertedWith("Airdrop already claimed.");
  });

  it("should not allow non-BAYC holder to claim the airdrop", async function () {
    const leaf = keccak256(ethers.utils.solidityPack(
      ["address", "uint256"],
      [user2.address, claimAmount]
    ));

    const merkleProof = merkleTree.getHexProof(leaf);

    // user2 does not own a BAYC NFT
    await expect(
      airdropContract.connect(user2).claimAirdrop(claimAmount, merkleProof)
    ).to.be.revertedWith("Must own a BAYC NFT to claim");
  });

  it("should not allow a user with invalid Merkle proof to claim airdrop", async function () {
    const leaf = keccak256(ethers.utils.solidityPack(
      ["address", "uint256"],
      [user1.address, claimAmount]
    ));

    // Generate an incorrect proof for user1
    const invalidProof = merkleTree.getHexProof(leaf).slice(1);

    // Try to claim with invalid proof
    await expect(
      airdropContract.connect(user1).claimAirdrop(claimAmount, invalidProof)
    ).to.be.revertedWith("Invalid Merkle proof.");
  });
});
