import { CasperChainClient } from "./client.js";
import { ContractRegistry } from "./contracts.js";
import { loadChainEnv } from "./config.js";

export type ChainServiceStatus = {
  network: string;
  nodeUrl: string;
  chainSpecName: string;
  signerConfigured: boolean;
  wallet: Awaited<ReturnType<CasperChainClient["getWalletInfo"]>>;
  contracts: ReturnType<ContractRegistry["snapshot"]>;
  contractsDeployed: boolean;
};

let singleton: ChainService | undefined;

export class ChainService {
  readonly client: CasperChainClient;
  readonly contracts: ContractRegistry;

  constructor(
    client: CasperChainClient = new CasperChainClient(loadChainEnv()),
    contracts: ContractRegistry = ContractRegistry.load(),
  ) {
    this.client = client;
    this.contracts = contracts;
  }

  static instance(): ChainService {
    if (!singleton) {
      singleton = new ChainService();
    }
    return singleton;
  }

  async status(): Promise<ChainServiceStatus> {
    const [networkStatus, wallet] = await Promise.all([
      this.client.getNetworkStatus(),
      this.client.getWalletInfo(),
    ]);

    return {
      network: this.contracts.networkName,
      nodeUrl: this.client.nodeUrl,
      chainSpecName: networkStatus.chainSpecName,
      signerConfigured: this.client.isSignerConfigured,
      wallet,
      contracts: this.contracts.snapshot(),
      contractsDeployed: this.contracts.allDeployed(),
    };
  }
}

export { CasperChainClient } from "./client.js";
export { ContractRegistry, syncTestnetConfigFromOdraToml } from "./contracts.js";
export { ChainWriter, type ProposeActionInput } from "./writer.js";
export { loadChainEnv, loadTestnetConfig } from "./config.js";
