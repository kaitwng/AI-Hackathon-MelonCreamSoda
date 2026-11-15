/* Consent adapter boundary: no provider is configured and no caller can create
 * verified consent through this module. A production adapter must verify the
 * provider callback, the authenticated caregiver, the data scope and policy. */
export class ConsentUnavailableError extends Error{constructor(){super('consent_not_configured');this.code='consent_not_configured'}}
export const ConsentScopes=Object.freeze({childPersonalData:'child_personal_data',healthData:'health_data'});
export function unconfiguredConsentProvider(){return Object.freeze({
  async startVerification(){throw new ConsentUnavailableError()},
  async verifyCallback(){throw new ConsentUnavailableError()},
  async getStatus(){return {status:'not_configured'}}
})}
/* A server-side consent record must be loaded by trusted storage, not request
 * JSON. Health data additionally requires a separate verified health scope. */
export function permitsChildData({age,personalConsent,healthConsent,scope,policyVersion}){
 if(!Number.isInteger(age)||age<0||age>120||!Object.values(ConsentScopes).includes(scope)||!policyVersion)return false;
 const verified=record=>!!record&&record.status==='verified'&&record.policyVersion===policyVersion&&record.providerReference&&record.providerVerified===true;
 if(age<13&&!verified(personalConsent))return false;
 if(scope===ConsentScopes.healthData&&!verified(healthConsent))return false;
 return true;
}
