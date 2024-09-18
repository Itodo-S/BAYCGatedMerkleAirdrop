import { ethers } from "hardhat";
import { expect } from "chai";
import { BaycGatedMerkleAirdrop, SYE } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
// import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/signers";
import keccak256 from "keccak256";
// import { MockERC721 } from "../typechain-types/MockERC721";
import { generateRootHash } from "../merkle";

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
        return {baycGatedMerkleAirdrop, token, baycAddress, rootHash};
    }

    it("should deploy contracts", async function () {
        const {baycGatedMerkleAirdrop, token, baycAddress, rootHash} = await deployNFT();
        expect(baycGatedMerkleAirdrop).to.exist;
        expect(token).to.exist;
        expect(baycAddress).to.exist;
        expect(rootHash).to.exist;
    });

})