function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(fn, ...args) {
  await timeout(3000);
  return fn(...args);
}

function save(chainId, name, value) {

  const fs = require("fs");

  const filename = '../wagyu-addresses/' + chainId + '.json'

  const data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : {}

  data[name] = value;

  fs.writeFileSync(filename, JSON.stringify(data, null, 4))

}

async function adjustPerifpherySourceCode(address) {

  const PATH_GET = "../wagyu-swap-periphery/contracts/libraries/PancakeLibraryTemplate.sol"
  const PATH_PUT = "../wagyu-swap-periphery/contracts/libraries/PancakeLibrary.sol"

  const contract = await ethers.getContractAt("WagyuFactory", address)

  const INIT_CODE_PAIR_HASH = await contract.INIT_CODE_PAIR_HASH()

  //console.log(INIT_CODE_PAIR_HASH);

  const fs = require("fs");

  const content = fs.readFileSync(PATH_GET, "utf8")

  const changedContent = content.replace("d0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66", INIT_CODE_PAIR_HASH.replace("0x", ""))
  
  fs.writeFileSync(PATH_PUT, changedContent);

  const { chainId } = await ethers.provider.getNetwork();
  

  save(chainId, "PancakeFactory_Init_Code_Hash", INIT_CODE_PAIR_HASH);

  return true

}

async function deploy(name, args=[]) {
  console.log("deploy " + name, args)
  const signers = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(signers[0]._address)
  const { chainId } = await ethers.provider.getNetwork();
  const Token = await ethers.getContractFactory(name);
  const finalArgs = [...args, { nonce }] 
  const token = await Token.deploy.apply(Token, finalArgs);
  
  save(chainId, name, token.address); 
  console.log("deployed ", name, token.address);
  return token.address

}

async function main() {
  // We get the contract to deploy

  const admins = JSON.parse(require("fs").readFileSync('../wagyu-addresses/admins.json', 'utf8'))
  
  WagyuFactory = await deploy("WagyuFactory", [admins._devaddr])

  await adjustPerifpherySourceCode(WagyuFactory)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
