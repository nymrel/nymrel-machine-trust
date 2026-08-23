/**
 * Typed errors for @nymrel/machine-trust
 *
 * Configuration problems fail closed: callers get a machine-readable,
 * deterministic error instead of silently generated output that asserts
 * something untrue.
 */
/** Error thrown when an explicit configuration relationship is malformed or self-contradictory. */
export class MachineTrustConfigError extends Error {
    /** Stable machine-readable code, safe to gate on in CI. */
    code;
    constructor(code, message) {
        super(`MACHINE_TRUST_CONFIG_ERROR(${code}): ${message}`);
        this.name = 'MachineTrustConfigError';
        this.code = code;
    }
}
//# sourceMappingURL=errors.js.map