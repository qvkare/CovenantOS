//! Shared contract constants and storage types.

use odra::prelude::*;

pub const ACTION_HOLD: u8 = 1;
pub const ACTION_RELEASE: u8 = 2;
pub const ACTION_TOP_UP_RESERVE: u8 = 3;

#[odra(type)]
pub struct ActionRecord {
    pub facility_id: u64,
    pub action_type: u8,
    pub params_hash: String,
    pub approval_weight: u8,
    pub required_weight: u8,
    pub executed: bool,
}

#[odra(type)]
pub struct EvidenceRecord {
    pub facility_id: u64,
    pub evidence_hash: String,
    pub source_id: String,
    pub x402_payment_ref: String,
    pub timestamp: u64,
    pub decision_id: String,
}
