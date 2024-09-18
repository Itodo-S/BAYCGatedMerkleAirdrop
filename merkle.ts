import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import csv from "csv-parser";

const csvFilePath = "./airdrop.csv"; 
const searchAddress = "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"; 

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const values = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        values.push([row.address, row.amount]);
      })
      .on("end", () => {
        resolve(values);
      })
      .on("error", reject);
  });
}

async function generateMerkleTree() {
  try {
    const values = await readCSV(csvFilePath);
    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    console.log("Merkle Root:", tree.root);
    fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));
  } catch (error) {
    console.error("Error generating Merkle tree:", error);
  }
}

async function generateProof() {
  const tree = StandardMerkleTree.load(
    JSON.parse(fs.readFileSync("tree.json", "utf8"))
  );
  for (const [i, v] of tree.entries()) {
    if (v[0] === searchAddress) {
      const proof = tree.getProof(i);
      console.log(i);
      console.log("Value:", v);
      console.log("Proof:", proof);
    }
  }
}

// // Run this to generate the Merkle tree Hash
// generateMerkleTree();

// //Run this to generate Proof for based on the selected address.
// await generateProof();

(async () => {
  // Run this to generate the Merkle tree Hash
  await generateMerkleTree();

  // Run this to generate Proof based on the selected address.
  await generateProof();
})();