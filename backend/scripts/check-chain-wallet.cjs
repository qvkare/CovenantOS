const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");
const {
  PrivateKey,
  KeyAlgorithm,
  RpcClient,
  HttpHandler,
  PurseIdentifier,
} = require("casper-js-sdk");

const root = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(root, ".env") });

const nodeUrl = process.env.CASPER_NODE_URL ?? "https://node.testnet.casper.network/rpc";
const pemPath = path.resolve(
  root,
  process.env.CASPER_SECRET_KEY_PATH ?? "keys/deployer_secret_key.pem",
);
const expectedPublicKey = process.env.CASPER_PUBLIC_KEY?.trim().toLowerCase();

function loadPrivateKeyFromPem(pemContents) {
  for (const alg of [KeyAlgorithm.ED25519, KeyAlgorithm.SECP256K1]) {
    try {
      return PrivateKey.fromPem(pemContents, alg);
    } catch {
      // try next algorithm
    }
  }
  throw new Error("Unsupported PEM format for Casper keys");
}

function loadPrivateKey() {
  const secretHex = process.env.CASPER_SECRET_KEY_HEX?.trim();
  if (secretHex) {
    return PrivateKey.fromHex(secretHex, KeyAlgorithm.ED25519);
  }

  if (fs.existsSync(pemPath)) {
    return loadPrivateKeyFromPem(fs.readFileSync(pemPath, "utf8"));
  }

  console.error(
    "Set CASPER_SECRET_KEY_HEX in .env or place a PEM at CASPER_SECRET_KEY_PATH",
  );
  process.exit(1);
}

const privateKey = loadPrivateKey();
const derivedPublicKey = privateKey.publicKey.toHex().toLowerCase();

if (expectedPublicKey && derivedPublicKey !== expectedPublicKey) {
  console.error("Key mismatch: CASPER_SECRET_KEY_HEX does not match CASPER_PUBLIC_KEY");
  console.error(`  derived:  ${derivedPublicKey}`);
  console.error(`  expected: ${expectedPublicKey}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(pemPath), { recursive: true });
fs.writeFileSync(pemPath, privateKey.toPem());

async function main() {
  const rpc = new RpcClient(new HttpHandler(nodeUrl));
  let balanceMotes = "0";
  let balanceCspr = 0;

  try {
    const balance = await rpc.queryLatestBalance(
      PurseIdentifier.fromPublicKey(privateKey.publicKey),
    );
    balanceMotes = balance.balance.toString();
    balanceCspr = Number(balanceMotes) / 1_000_000_000;
  } catch (error) {
    const message = error.sourceErr?.message ?? error.message;
    console.warn(`Balance lookup failed: ${message}`);
  }

  const result = {
    pemPath,
    publicKey: privateKey.publicKey.toHex(),
    accountHash: privateKey.publicKey.accountHash().toHex(),
    balanceMotes,
    balanceCspr,
    nodeUrl,
    keyMatchesExpected: expectedPublicKey ? derivedPublicKey === expectedPublicKey : null,
  };

  console.log(JSON.stringify(result, null, 2));

  if (balanceCspr === 0) {
    console.warn(
      "Balance is zero — the secret key in .env may belong to a different wallet than the funded testnet account.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
