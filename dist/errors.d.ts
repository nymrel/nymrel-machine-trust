/**
 * Typed errors for @nymrel/machine-trust
 *
 * Configuration problems fail closed: callers get a machine-readable,
 * deterministic error instead of silently generated output that asserts
 * something untrue.
 */
/** Stable, CI-gateable error codes carried by MachineTrustConfigError. */
export type MachineTrustErrorCode = 'PARENT_ORGANIZATION_MALFORMED' | 'PARENT_ORGANIZATION_CYCLE' | 'PARENT_ORGANIZATION_MISSTATEMENT' | 'CONTRADICTORY_NYMREL_ATTRIBUTION' | 'INVALID_NYMREL_ATTRIBUTION' | 'INVALID_FIXED_TIMESTAMP' | 'INVALID_ROBOTS_DIRECTIVE' | 'INVALID_TARGET_SELECTOR';
/** Error thrown when an explicit configuration relationship is malformed or self-contradictory. */
export declare class MachineTrustConfigError extends Error {
    /** Stable machine-readable code, safe to gate on in CI. */
    readonly code: MachineTrustErrorCode;
    constructor(code: MachineTrustErrorCode, message: string);
}
//# sourceMappingURL=errors.d.ts.map