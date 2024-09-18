// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract BaycGatedMerkleAirdrop {
    IERC20 public token;
    IERC721 public baycNft;
    bytes32 public merkleRoot;

    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed claimant, uint256 amount);

    constructor(address _token, address _baycNft, bytes32 _merkleRoot) {
        token = IERC20(_token);
        baycNft = IERC721(_baycNft);
        merkleRoot = _merkleRoot;
    }

    function claimAirdrop(
        address claimant,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(baycNft.balanceOf(claimant) > 0, "Must own a BAYC NFT to claim");
        require(!hasClaimed[claimant], "Airdrop already claimed.");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(claimant, amount))));

        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Invalid Merkle proof."
        );

        hasClaimed[claimant] = true;

        require(token.transfer(claimant, amount), "Token transfer failed.");

        emit AirdropClaimed(claimant, amount);
    }
}
