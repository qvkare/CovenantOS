//! PolicyGuard — action thresholds and multisig approval.
//! Full implementation in Phase 2.

use odra::prelude::*;
use odra::Address;

#[odra::module]
pub struct PolicyGuard {
    owner: Var<Address>,
    paused: Var<bool>,
}

#[odra::module]
impl PolicyGuard {
    #[odra(init)]
    pub fn init(&mut self, owner: Address) {
        self.owner.set(owner);
        self.paused.set(false);
    }

    pub fn pause(&mut self) {
        self.ensure_owner();
        self.paused.set(true);
    }

    pub fn unpause(&mut self) {
        self.ensure_owner();
        self.paused.set(false);
    }

    pub fn is_paused(&self) -> bool {
        self.paused.get_or_default()
    }

    fn ensure_owner(&self) {
        if self.env().caller() != self.owner.get_or_default() {
            odra::revert("NOT_OWNER");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    #[test]
    fn starts_unpaused() {
        let env = HostEnv::new();
        let mut deployer = env.get_deployer();
        let owner = env.caller();

        let contract = PolicyGuard::deploy(&mut deployer, owner);
        assert!(!contract.is_paused());
    }
}
