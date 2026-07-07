#![doc = "Odra CLI entrypoint for CovenantOS contracts."]

use covenantos_contracts::{
    evidence_receipt::{EvidenceReceipt, EvidenceReceiptInitArgs},
    facility_vault::{FacilityVault, FacilityVaultInitArgs},
    policy_guard::{PolicyGuard, PolicyGuardInitArgs},
};
use odra::prelude::Addressable;
use odra::host::HostEnv;
use odra_cli::{
    deploy::{DeployScript, Error as DeployError},
    log, DeployedContractsContainer, DeployerExt, OdraCli,
};

const DEPLOY_GAS: u64 = 400_000_000_000;

struct CovenantOsDeploy;

impl DeployScript for CovenantOsDeploy {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), DeployError> {
        let owner = env.get_account(0);
        env.set_caller(owner);

        let mut policy = PolicyGuard::load_or_deploy(
            env,
            PolicyGuardInitArgs { owner },
            container,
            DEPLOY_GAS,
        )?;

        let operator = env.get_account(0);
        let _evidence = EvidenceReceipt::load_or_deploy(
            env,
            EvidenceReceiptInitArgs { operator },
            container,
            DEPLOY_GAS,
        )?;

        let vault = FacilityVault::load_or_deploy(
            env,
            FacilityVaultInitArgs {
                owner,
                policy_guard: policy.address(),
            },
            container,
            DEPLOY_GAS,
        )?;

        env.set_caller(owner);
        env.set_gas(DEPLOY_GAS);
        policy.set_vault(vault.address());

        log(format!(
            "Linked PolicyGuard ({:?}) to FacilityVault ({:?})",
            policy.address(),
            vault.address()
        ));

        Ok(())
    }
}

fn main() {
    OdraCli::new()
        .about("CovenantOS smart contract CLI")
        .contracts_file("resources/casper-test-contracts.toml")
        .contract::<PolicyGuard>()
        .contract::<EvidenceReceipt>()
        .contract::<FacilityVault>()
        .deploy(CovenantOsDeploy)
        .build()
        .run();
}
