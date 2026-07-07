//! CovenantOS smart contracts for Casper Network.
//!
//! ```bash
//! cargo install cargo-odra --locked
//! cd contracts
//! cargo odra test
//! cargo odra build -b casper
//! ```

mod types;
mod policy_guard;
mod evidence_receipt;
mod facility_vault;

pub use policy_guard::PolicyGuard;
pub use evidence_receipt::EvidenceReceipt;
pub use facility_vault::FacilityVault;
pub use types::{ActionRecord, EvidenceRecord, ACTION_HOLD, ACTION_RELEASE, ACTION_TOP_UP_RESERVE};
