const path = require("node:path");
const fs = require("node:fs");

const repoRoot = path.resolve(__dirname, "../..");
const tomlPath = path.join(repoRoot, "contracts/resources/casper-test-contracts.toml");
const configPath = path.join(repoRoot, "shared/config/testnet.json");

if (!fs.existsSync(tomlPath)) {
  console.error(`Missing deploy artifact: ${tomlPath}`);
  console.error("Run: cd contracts && cargo odra build && cargo run --bin covenantos_contracts_cli -- deploy --deploy-mode default");
  process.exit(1);
}

const toml = fs.readFileSync(tomlPath, "utf8");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const mapping = {
  PolicyGuard: "policyGuard",
  EvidenceReceipt: "evidenceReceipt",
  FacilityVault: "facilityVault",
};

for (const [contractName, configKey] of Object.entries(mapping)) {
  const regex = new RegExp(
    `name\\s*=\\s*"${contractName}"[\\s\\S]*?package_hash\\s*=\\s*"([^"]+)"`,
  );
  const match = toml.match(regex);
  if (match?.[1]) {
    config.contracts[configKey] = {
      packageHash: match[1],
      contractHash: match[1],
    };
  }
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Updated ${configPath}`);
