


function save(chainId, name, value) {

  const fs = require("fs");

  const filename = '../wagyu-addresses/' + chainId + '.json'

  const data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : {}

  data[name] = value;

  fs.writeFileSync(filename, JSON.stringify(data, null, 4))

}



async function createTestPool(name) {
  console.log("create LP pool " + name)
  const signers = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(signers[0]._address)
  const { chainId } = await ethers.provider.getNetwork();
  //const blockNumber = await ethers.provider.getBlockNumber();
  const data = get(chainId)
  const tokenA = data.WVLX
  const tokenB = data[name]

  if (tokenA == tokenB)
    throw "token names should be different"

  const PancakeFactory = await ethers.getContractAt("PancakeFactory", data.PancakeFactory);
  const PoolAddress = await PancakeFactory.createPair(tokenA, tokenB, { nonce, gasLimit: 9000000 })
  
  const result = await PoolAddress.wait(1)
  const event = result.events.find((x)=> x.event == "PairCreated");
  
  save(chainId, "VLX_" + name + "_LP", { pair: event.args.pair, tokenA, tokenB } );

  return true
}

function get(chainId) {
  const fs = require("fs");

  const filename = '../wagyu-addresses/' + chainId + '.json'

  const data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : {}

  return data;
}

async function main() {

  await createTestPool("VBNB")
  await createTestPool("VETHER")
  await createTestPool("VUSDT");
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
