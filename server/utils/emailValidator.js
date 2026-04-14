function getAllowedDomains() {
    const raw = process.env.ALLOWED_COLLEGE_DOMAINS;
    if (!raw) return [];

    return raw
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Validate that an email belongs to a college domain.
 *
 * @param {string} email
 * @param {string[]} [allowedDomains] - optional explicit domain list; defaults to env
 * @returns {{ valid: boolean, domain: string | null, message: string }}
 */
function isCollegeEmail(email, allowedDomains) {
    if (typeof email !== "string") {
        return {
            valid: false,
            domain: null,
            message: "Email must be a string.",
        };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const atIndex = normalizedEmail.lastIndexOf("@");

    if (atIndex === -1 || atIndex === normalizedEmail.length - 1) {
        return {
            valid: false,
            domain: null,
            message: "Invalid email format.",
        };
    }

    const domain = normalizedEmail.slice(atIndex + 1);

    const domains = Array.isArray(allowedDomains)
        ? allowedDomains.map((d) => d.toLowerCase())
        : getAllowedDomains();

    // Fallback: if no allowed domains configured, accept any .edu domain
    if (!domains.length) {
        const isEdu = domain.endsWith(".edu");
        return {
            valid: isEdu,
            domain,
            message: isEdu
                ? "Valid .edu email (development mode)."
                : "Email domain must end with .edu.",
        };
    }

    const isAllowed = domains.includes(domain);

    return {
        valid: isAllowed,
        domain,
        message: isAllowed
            ? "Valid college email."
            : "Email domain is not allowed for registration.",
    };
}

module.exports = {
    isCollegeEmail,
};

