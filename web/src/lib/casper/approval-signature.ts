import type { ProposedAction } from "@covenantos/shared";
import type { ICSPRClickSDK } from "@make-software/csprclick-core-types";

const APPROVAL_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
  ],
  PolicyApproval: [
    { name: "actionId", type: "string" },
    { name: "facilityId", type: "string" },
    { name: "actionType", type: "string" },
    { name: "evidenceHashes", type: "string" },
    { name: "paramsHash", type: "string" },
    { name: "approver", type: "string" },
  ],
};

export function buildApprovalTypedData(action: ProposedAction, approver: string) {
  return {
    domain: {
      name: "CovenantOS",
      version: "1",
      chainId: 2,
    },
    types: APPROVAL_TYPES,
    primaryType: "PolicyApproval",
    message: {
      actionId: action.id,
      facilityId: action.facilityId,
      actionType: action.type,
      evidenceHashes: action.evidenceIds.join(","),
      paramsHash: action.paramsHash ?? "",
      approver,
    },
  };
}

export async function signPolicyApproval(
  click: ICSPRClickSDK,
  action: ProposedAction,
  approver: string,
): Promise<string> {
  const typedData = buildApprovalTypedData(action, approver);
  const result = await click.signTypedData({ typedData }, approver);
  if (!result?.signatureHex) {
    throw new Error("Approval signature was not returned by CSPR.click");
  }
  return result.signatureHex;
}
