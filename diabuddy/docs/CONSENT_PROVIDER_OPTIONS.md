# U.S. parental consent: options to evaluate

DiaBuddy has not selected or integrated a provider. No checkbox, PIN, device pairing, or adult-verification result alone establishes valid parental consent. The current prototype should use fictional information only. Before launch, map exactly what data is collected, who receives it, and for what purpose; prepare direct parental notices, a privacy policy, retention/deletion processes, and a separate health-data permission. Have U.S. privacy counsel and the relevant healthcare/privacy specialists review those practices. FTC guidance: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

## PRIVO iD

PRIVO describes its platform as offering identity verification, parental consent and permissions management; its documented flow supports parents approving or denying specific features. Evaluate it as an integrated consent option and confirm with PRIVO whether it supports DiaBuddy’s intended health-related data practices, separate permissions, withdrawal, service-provider/subprocessor agreements, data location, retention, pricing, and developer sandbox. Setup would require a PRIVO business relationship, provider configuration, approved notice/privacy language, integration credentials, and an authenticated callback or API workflow. Sources: https://www.privo.com/parents and https://help.privo.com/knowledge/how-does-the-privo-id-work

## Epic Kids Web Services (KWS)

KWS offers separate age assurance, parent verification, and consent-related services. Its Parent Verification service verifies adult status; Epic explicitly says that service alone does **not** obtain consent or meet direct-notice requirements. Verify whether its current consent services and contractual terms support DiaBuddy’s specific health-related use before selecting it. Setup begins with an Epic developer account, organization and product, acceptance of KWS terms, configuring the relevant services and webhook, and implementing the required notices and consent records. Sources: https://dev.epicgames.com/docs/kids-web-services/kws-get-started and https://dev.epicgames.com/docs/kids-web-services/parent-verification-service/pv-service-flow

## Selection questions

Ask each provider about U.S. availability, minimum/maximum data shared, verified relationship versus adult status, integration and callback authentication, consent granularity, revocation, deletion, audits, error/retry handling, cost, and support for sensitive health data. Do not assume that a provider, safe-harbor membership, or an agreement makes DiaBuddy compliant. Review any HIPAA applicability and business-associate agreement needs with counsel; do not send child health data to a provider without an appropriate agreement and a confirmed lawful basis.
