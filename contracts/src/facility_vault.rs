use odra::casper_types::U512;
use odra::prelude::*;
use odra::ContractRef;

use crate::policy_guard::PolicyGuardContractRef;
use crate::types::{ACTION_HOLD, ACTION_RELEASE, ACTION_TOP_UP_RESERVE};

#[odra::event]
pub struct Deposited {
    pub facility_id: u64,
    pub amount: U512,
    pub depositor: Address,
}

#[odra::event]
pub struct Held {
    pub facility_id: u64,
    pub amount: U512,
    pub action_id: u64,
}

#[odra::event]
pub struct Released {
    pub facility_id: u64,
    pub recipient: Address,
    pub amount: U512,
    pub action_id: u64,
}

#[odra::event]
pub struct ReserveToppedUp {
    pub facility_id: u64,
    pub amount: U512,
    pub action_id: u64,
}

#[odra::odra_error]
pub enum Error {
    ZeroDeposit = 1,
    PolicyGuardNotSet = 2,
    InsufficientBalance = 3,
    InsufficientHeldBalance = 4,
    FacilityPaused = 5,
}

#[odra::module(
    events = [Deposited, Held, Released, ReserveToppedUp],
    errors = Error
)]
pub struct FacilityVault {
    owner: Var<Address>,
    policy_guard: Var<Address>,
    balances: Mapping<u64, U512>,
    held: Mapping<u64, U512>,
    reserve: Mapping<u64, U512>,
}

#[odra::module]
impl FacilityVault {
    pub fn init(&mut self, owner: Address, policy_guard: Address) {
        self.owner.set(owner);
        self.policy_guard.set(policy_guard);
    }

    #[odra(payable)]
    pub fn deposit(&mut self, facility_id: u64) {
        let amount = self.env().attached_value();
        if amount.is_zero() {
            self.env().revert(Error::ZeroDeposit);
        }

        self.balances.add(&facility_id, amount);
        self.env().emit_event(Deposited {
            facility_id,
            amount,
            depositor: self.env().caller(),
        });
    }

    pub fn hold(&mut self, facility_id: u64, amount: U512, action_id: u64) {
        self.assert_policy_active();
        self.policy()
            .consume_executable_action(action_id, ACTION_HOLD, facility_id);

        let balance = self.balances.get_or_default(&facility_id);
        if balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }

        self.balances.set(&facility_id, balance - amount);
        self.held.add(&facility_id, amount);
        self.env().emit_event(Held {
            facility_id,
            amount,
            action_id,
        });
    }

    pub fn release(&mut self, facility_id: u64, recipient: Address, amount: U512, action_id: u64) {
        self.assert_policy_active();
        self.policy()
            .consume_executable_action(action_id, ACTION_RELEASE, facility_id);

        let held = self.held.get_or_default(&facility_id);
        if held < amount {
            self.env().revert(Error::InsufficientHeldBalance);
        }

        self.held.set(&facility_id, held - amount);
        self.env().transfer_tokens(&recipient, &amount);
        self.env().emit_event(Released {
            facility_id,
            recipient,
            amount,
            action_id,
        });
    }

    pub fn top_up_reserve(&mut self, facility_id: u64, amount: U512, action_id: u64) {
        self.assert_policy_active();
        self.policy().consume_executable_action(
            action_id,
            ACTION_TOP_UP_RESERVE,
            facility_id,
        );

        let balance = self.balances.get_or_default(&facility_id);
        if balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }

        self.balances.set(&facility_id, balance - amount);
        self.reserve.add(&facility_id, amount);
        self.env().emit_event(ReserveToppedUp {
            facility_id,
            amount,
            action_id,
        });
    }

    pub fn balance_of(&self, facility_id: u64) -> U512 {
        self.balances.get_or_default(&facility_id)
    }

    pub fn held_of(&self, facility_id: u64) -> U512 {
        self.held.get_or_default(&facility_id)
    }

    pub fn reserve_of(&self, facility_id: u64) -> U512 {
        self.reserve.get_or_default(&facility_id)
    }

    fn policy(&self) -> PolicyGuardContractRef {
        PolicyGuardContractRef::new(
            self.env(),
            self.policy_guard
                .get()
                .unwrap_or_revert_with(self, Error::PolicyGuardNotSet),
        )
    }

    fn assert_policy_active(&self) {
        if self.policy().is_paused() {
            self.env().revert(Error::FacilityPaused);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::policy_guard::PolicyGuardInitArgs;
    use odra::host::{Deployer, HostRef};

    fn setup(
        env: &odra::host::HostEnv,
    ) -> (
        crate::policy_guard::PolicyGuardHostRef,
        FacilityVaultHostRef,
        Address,
        Address,
        Address,
    ) {
        let owner = env.get_account(0);
        let signer_a = env.get_account(1);
        let signer_b = env.get_account(2);
        let depositor = env.get_account(3);

        let mut policy =
            crate::policy_guard::PolicyGuard::deploy(&env, PolicyGuardInitArgs { owner });

        env.set_caller(owner);
        policy.set_signer_weight(signer_a, 1);
        policy.set_signer_weight(signer_b, 2);

        let vault = FacilityVault::deploy(
            &env,
            FacilityVaultInitArgs {
                owner,
                policy_guard: policy.address(),
            },
        );

        env.set_caller(owner);
        policy.set_vault(vault.address());

        (policy, vault, signer_a, signer_b, depositor)
    }

    #[test]
    fn hold_and_release_with_approved_action() {
        let env = odra_test::env();
        let (mut policy, mut vault, signer_a, signer_b, depositor) = setup(&env);

        let deposit_amount = U512::from(1_000_000_000_000u64);
        env.set_caller(depositor);
        vault.with_tokens(deposit_amount).deposit(1);
        assert_eq!(vault.balance_of(1), deposit_amount);

        env.set_caller(signer_a);
        let hold_action = policy.propose_action(1, ACTION_HOLD, "hold-hash".to_string());
        env.set_caller(signer_b);
        policy.approve_action(hold_action);

        let hold_amount = U512::from(300_000_000_000u64);
        env.set_caller(depositor);
        vault.hold(1, hold_amount, hold_action);

        assert_eq!(vault.balance_of(1), deposit_amount - hold_amount);
        assert_eq!(vault.held_of(1), hold_amount);

        env.set_caller(signer_a);
        let release_action = policy.propose_action(1, ACTION_RELEASE, "release-hash".to_string());
        env.set_caller(signer_b);
        policy.approve_action(release_action);

        let recipient = env.get_account(4);
        env.set_caller(depositor);
        vault.release(1, recipient, hold_amount, release_action);

        assert_eq!(vault.held_of(1), U512::zero());
        assert!(env.balance_of(&recipient) >= hold_amount);
    }

    #[test]
    fn top_up_reserve_moves_balance_to_reserve() {
        let env = odra_test::env();
        let (mut policy, mut vault, signer_a, _signer_b, depositor) = setup(&env);

        let deposit_amount = U512::from(500_000_000_000u64);
        env.set_caller(depositor);
        vault.with_tokens(deposit_amount).deposit(1);

        env.set_caller(signer_a);
        let action_id = policy.propose_action(1, ACTION_TOP_UP_RESERVE, "reserve-hash".to_string());
        policy.approve_action(action_id);

        let reserve_amount = U512::from(100_000_000_000u64);
        env.set_caller(depositor);
        vault.top_up_reserve(1, reserve_amount, action_id);

        assert_eq!(vault.balance_of(1), deposit_amount - reserve_amount);
        assert_eq!(vault.reserve_of(1), reserve_amount);
    }
}
