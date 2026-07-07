//! PolicyGuard — action thresholds, multisig approval, and kill-switch.

use odra::prelude::*;
use odra::Address;

use crate::types::{ActionRecord, ACTION_HOLD, ACTION_RELEASE, ACTION_TOP_UP_RESERVE};

#[odra::event]
pub struct ActionProposed {
    pub action_id: u64,
    pub facility_id: u64,
    pub action_type: u8,
    pub params_hash: String,
    pub proposer: Address,
}

#[odra::event]
pub struct ActionApproved {
    pub action_id: u64,
    pub approver: Address,
    pub approval_weight: u8,
    pub required_weight: u8,
}

#[odra::event]
pub struct ActionExecutable {
    pub action_id: u64,
    pub facility_id: u64,
    pub action_type: u8,
}

#[odra::event]
pub struct FacilityPaused {
    pub paused: bool,
}

#[odra::module(
    events = [ActionProposed, ActionApproved, ActionExecutable, FacilityPaused]
)]
pub struct PolicyGuard {
    owner: Var<Address>,
    vault: Var<Address>,
    paused: Var<bool>,
    next_action_id: Var<u64>,
    thresholds: Mapping<u8, u8>,
    signer_weights: Mapping<Address, u8>,
    actions: Mapping<u64, ActionRecord>,
}

#[odra::module]
impl PolicyGuard {
    #[odra(init)]
    pub fn init(&mut self, owner: Address) {
        self.owner.set(owner);
        self.vault.set(Address::default());
        self.paused.set(false);
        self.next_action_id.set(1);

        self.thresholds.set(&ACTION_HOLD, 2);
        self.thresholds.set(&ACTION_RELEASE, 2);
        self.thresholds.set(&ACTION_TOP_UP_RESERVE, 1);
    }

    pub fn set_vault(&mut self, vault: Address) {
        self.ensure_owner();
        self.vault.set(vault);
    }

    pub fn set_signer_weight(&mut self, signer: Address, weight: u8) {
        self.ensure_owner();
        if weight == 0 {
            odra::revert("INVALID_SIGNER_WEIGHT");
        }
        self.signer_weights.set(&signer, weight);
    }

    pub fn set_threshold(&mut self, action_type: u8, required_weight: u8) {
        self.ensure_owner();
        if required_weight == 0 {
            odra::revert("INVALID_THRESHOLD");
        }
        self.thresholds.set(&action_type, required_weight);
    }

    pub fn propose_action(
        &mut self,
        facility_id: u64,
        action_type: u8,
        params_hash: String,
    ) -> u64 {
        self.assert_not_paused();
        self.assert_valid_action_type(action_type);

        let action_id = self.next_action_id.get_or_default();
        self.next_action_id.set(action_id + 1);

        let required_weight = self.thresholds.get_or_default(&action_type);
        let record = ActionRecord {
            facility_id,
            action_type,
            params_hash: params_hash.clone(),
            approval_weight: 0,
            required_weight,
            executed: false,
        };
        self.actions.set(&action_id, record);

        self.env().emit_event(ActionProposed {
            action_id,
            facility_id,
            action_type,
            params_hash,
            proposer: self.env().caller(),
        });

        action_id
    }

    pub fn approve_action(&mut self, action_id: u64) {
        self.assert_not_paused();

        let mut action = self
            .actions
            .get(&action_id)
            .unwrap_or_else(|| odra::revert("ACTION_NOT_FOUND"));

        if action.executed {
            odra::revert("ACTION_ALREADY_EXECUTED");
        }

        let signer_weight = self.signer_weights.get_or_default(&self.env().caller());
        if signer_weight == 0 {
            odra::revert("UNAUTHORIZED_SIGNER");
        }

        action.approval_weight = action
            .approval_weight
            .saturating_add(signer_weight)
            .min(u8::MAX);
        self.actions.set(&action_id, action);

        let updated = self.actions.get(&action_id).unwrap();
        self.env().emit_event(ActionApproved {
            action_id,
            approver: self.env().caller(),
            approval_weight: updated.approval_weight,
            required_weight: updated.required_weight,
        });

        if updated.approval_weight >= updated.required_weight {
            self.env().emit_event(ActionExecutable {
                action_id,
                facility_id: updated.facility_id,
                action_type: updated.action_type,
            });
        }
    }

    pub fn consume_executable_action(
        &mut self,
        action_id: u64,
        action_type: u8,
        facility_id: u64,
    ) {
        self.assert_not_paused();
        self.assert_only_vault();

        let mut action = self
            .actions
            .get(&action_id)
            .unwrap_or_else(|| odra::revert("ACTION_NOT_FOUND"));

        if action.executed {
            odra::revert("ACTION_ALREADY_EXECUTED");
        }

        if action.approval_weight < action.required_weight {
            odra::revert("INSUFFICIENT_APPROVAL_WEIGHT");
        }

        if action.action_type != action_type {
            odra::revert("ACTION_TYPE_MISMATCH");
        }

        if action.facility_id != facility_id {
            odra::revert("FACILITY_MISMATCH");
        }

        action.executed = true;
        self.actions.set(&action_id, action);
    }

    pub fn assert_allowed(&self, action_id: u64, approval_weight: u8) {
        self.assert_not_paused();

        let action = self
            .actions
            .get(&action_id)
            .unwrap_or_else(|| odra::revert("ACTION_NOT_FOUND"));

        if action.executed {
            odra::revert("ACTION_ALREADY_EXECUTED");
        }

        if approval_weight < action.required_weight {
            odra::revert("INSUFFICIENT_APPROVAL_WEIGHT");
        }
    }

    pub fn get_action(&self, action_id: u64) -> Option<ActionRecord> {
        self.actions.get(&action_id)
    }

    pub fn is_paused(&self) -> bool {
        self.paused.get_or_default()
    }

    pub fn pause(&mut self) {
        self.ensure_owner();
        self.paused.set(true);
        self.env().emit_event(FacilityPaused { paused: true });
    }

    pub fn unpause(&mut self) {
        self.ensure_owner();
        self.paused.set(false);
        self.env().emit_event(FacilityPaused { paused: false });
    }

    fn assert_valid_action_type(&self, action_type: u8) {
        match action_type {
            ACTION_HOLD | ACTION_RELEASE | ACTION_TOP_UP_RESERVE => {}
            _ => odra::revert("INVALID_ACTION_TYPE"),
        }
    }

    fn ensure_owner(&self) {
        if self.env().caller() != self.owner.get_or_default() {
            odra::revert("NOT_OWNER");
        }
    }

    fn assert_only_vault(&self) {
        if self.env().caller() != self.vault.get_or_default() {
            odra::revert("ONLY_VAULT");
        }
    }

    fn assert_not_paused(&self) {
        if self.paused.get_or_default() {
            odra::revert("FACILITY_PAUSED");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv, HostEnvExt};

    #[test]
    fn starts_unpaused() {
        let env = HostEnv::new();
        let mut deployer = env.get_deployer();
        let owner = env.caller();

        let contract = PolicyGuard::deploy(&mut deployer, owner);
        assert!(!contract.is_paused());
    }

    #[test]
    fn approve_reaches_threshold_and_emits_executable() {
        let env = HostEnv::new();
        let owner = env.get_account(0);
        let signer_a = env.get_account(1);
        let signer_b = env.get_account(2);

        let mut deployer = env.get_deployer();
        let mut contract = PolicyGuard::deploy(&mut deployer, owner);

        env.set_caller(owner);
        contract.set_signer_weight(signer_a, 1);
        contract.set_signer_weight(signer_b, 2);

        env.set_caller(signer_a);
        let action_id = contract.propose_action(1, ACTION_HOLD, "hash-1".to_string());

        env.set_caller(signer_b);
        contract.approve_action(action_id);

        let action = contract.get_action(action_id).unwrap();
        assert_eq!(action.approval_weight, 2);
        assert!(!action.executed);

        assert!(env.emitted(
            contract.address(),
            ActionExecutable {
                action_id,
                facility_id: 1,
                action_type: ACTION_HOLD,
            }
        ));
    }

    #[test]
    fn insufficient_approval_stays_below_threshold() {
        let env = HostEnv::new();
        let owner = env.get_account(0);
        let signer_a = env.get_account(1);

        let mut deployer = env.get_deployer();
        let mut contract = PolicyGuard::deploy(&mut deployer, owner);

        env.set_caller(owner);
        contract.set_signer_weight(signer_a, 1);

        env.set_caller(signer_a);
        let action_id = contract.propose_action(1, ACTION_HOLD, "hash-2".to_string());

        let action = contract.get_action(action_id).unwrap();
        assert_eq!(action.approval_weight, 0);
        assert!(action.approval_weight < action.required_weight);
    }
}
