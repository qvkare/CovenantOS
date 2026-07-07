//! EvidenceReceipt — on-chain evidence hash registry.

use odra::prelude::*;
use odra::Address;

use crate::types::EvidenceRecord;

#[odra::event]
pub struct EvidenceRecorded {
    pub evidence_id: u64,
    pub facility_id: u64,
    pub evidence_hash: String,
    pub source_id: String,
    pub x402_payment_ref: String,
    pub timestamp: u64,
}

#[odra::module(events = [EvidenceRecorded])]
pub struct EvidenceReceipt {
    operator: Var<Address>,
    next_evidence_id: Var<u64>,
    evidences: Mapping<u64, EvidenceRecord>,
}

#[odra::module]
impl EvidenceReceipt {
    #[odra(init)]
    pub fn init(&mut self, operator: Address) {
        self.operator.set(operator);
        self.next_evidence_id.set(1);
    }

    pub fn record_evidence(
        &mut self,
        facility_id: u64,
        evidence_hash: String,
        source_id: String,
        x402_payment_ref: String,
        timestamp: u64,
    ) -> u64 {
        self.ensure_operator();

        if evidence_hash.is_empty() {
            odra::revert("EMPTY_EVIDENCE_HASH");
        }

        let evidence_id = self.next_evidence_id.get_or_default();
        self.next_evidence_id.set(evidence_id + 1);

        let record = EvidenceRecord {
            facility_id,
            evidence_hash: evidence_hash.clone(),
            source_id: source_id.clone(),
            x402_payment_ref: x402_payment_ref.clone(),
            timestamp,
            decision_id: String::new(),
        };
        self.evidences.set(&evidence_id, record);

        self.env().emit_event(EvidenceRecorded {
            evidence_id,
            facility_id,
            evidence_hash,
            source_id,
            x402_payment_ref,
            timestamp,
        });

        evidence_id
    }

    pub fn link_decision(&mut self, evidence_id: u64, decision_id: String) {
        self.ensure_operator();

        let mut record = self
            .evidences
            .get(&evidence_id)
            .unwrap_or_else(|| odra::revert("EVIDENCE_NOT_FOUND"));

        record.decision_id = decision_id;
        self.evidences.set(&evidence_id, record);
    }

    pub fn get_evidence(&self, evidence_id: u64) -> Option<EvidenceRecord> {
        self.evidences.get(&evidence_id)
    }

    fn ensure_operator(&self) {
        if self.env().caller() != self.operator.get_or_default() {
            odra::revert("NOT_OPERATOR");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv, HostEnvExt};

    #[test]
    fn records_evidence_and_links_decision() {
        let env = HostEnv::new();
        let operator = env.get_account(0);
        let mut deployer = env.get_deployer();
        let mut contract = EvidenceReceipt::deploy(&mut deployer, operator);

        env.set_caller(operator);
        let evidence_id = contract.record_evidence(
            42,
            "abc123".to_string(),
            "mock-bank-statement".to_string(),
            "casper:pay:ref".to_string(),
            1_700_000_000,
        );

        contract.link_decision(evidence_id, "decision-001".to_string());

        let record = contract.get_evidence(evidence_id).unwrap();
        assert_eq!(record.facility_id, 42);
        assert_eq!(record.decision_id, "decision-001");

        assert!(env.emitted(
            contract.address(),
            EvidenceRecorded {
                evidence_id,
                facility_id: 42,
                evidence_hash: "abc123".to_string(),
                source_id: "mock-bank-statement".to_string(),
                x402_payment_ref: "casper:pay:ref".to_string(),
                timestamp: 1_700_000_000,
            }
        ));
    }
}
