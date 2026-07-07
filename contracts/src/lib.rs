//! CovenantOS smart contracts — Phase 2 implementation target.
//!
//! Setup (requires Rust + cargo-odra):
//! ```bash
//! cargo install cargo-odra --locked
//! cd contracts
//! cargo odra test
//! cargo odra build -b casper
//! ```

mod policy_guard;
mod evidence_receipt;
mod facility_vault;

pub use policy_guard::PolicyGuard;
pub use evidence_receipt::EvidenceReceipt;
pub use facility_vault::FacilityVault;
