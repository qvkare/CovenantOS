//! EvidenceReceipt — on-chain evidence hash registry.
//! Full implementation in Phase 2.

use odra::prelude::*;

#[odra::module]
pub struct EvidenceReceipt {}

#[odra::module]
impl EvidenceReceipt {
    #[odra(init)]
    pub fn init(&mut self) {}
}
