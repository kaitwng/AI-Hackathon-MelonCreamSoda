/* Provider-independent family authorization and pairing domain.
 * The caller MUST authenticate the actor on the server and provide a transactional
 * repository implementing the methods below. This module does not authenticate users.
 */
export class FamilyError extends Error { constructor(code){super(code);this.code=code} }
const fail=code=>{throw new FamilyError(code)};
const bytesToHex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
export async function tokenHash(token){if(!/^[0-9a-f]{64}$/.test(token||''))fail('invalid_invitation');return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))))}
export function createToken(){return bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}
export function requireActor(actor){if(!actor||typeof actor.id!=='string'||!actor.id||!['parent','child'].includes(actor.role))fail('unauthenticated');return actor}
export async function authorizeChild(repo,actor,childId,permission='view'){
  requireActor(actor);
  if(actor.role==='child') {if(permission!=='view'||!await repo.isChildAccount(actor.id,childId))fail('forbidden');return true}
  if(!await repo.hasCaregiverPermission(actor.id,childId,permission))fail('forbidden');return true;
}
/* Transactions must lock rows and atomically apply constraints. Never expose this
 * internal interface to clients or accept the actor identity from a request body.
 * Rate limiting belongs at the network boundary, before token lookup. */
export async function issuePairing(repo,actor,childId,now=Date.now()){
  requireActor(actor);if(actor.role!=='parent')fail('forbidden');
  await authorizeChild(repo,actor,childId,'manage_family');
  const token=createToken(),hash=await tokenHash(token),expiresAt=now+10*60*1000;
  await repo.transaction(async tx=>{await tx.cancelOpenInvitations(childId);await tx.insertInvitation({hash,childId,createdBy:actor.id,expiresAt,state:'open'})});
  return {token,expiresAt};
}
export async function requestPairing(repo,actor,token,now=Date.now()){
  requireActor(actor);if(actor.role!=='child')fail('forbidden');const hash=await tokenHash(token);
  return repo.transaction(async tx=>{const invite=await tx.lockInvitation(hash);if(!invite||invite.state!=='open'||invite.expiresAt<=now)fail('invalid_or_expired_invitation');if(await tx.childAccountHasProfile(actor.id))fail('existing_child_link');await tx.setInvitationPending(hash,actor.id,now);return {status:'pending'}});
}
export async function confirmPairing(repo,actor,hash,now=Date.now()){
  requireActor(actor);if(actor.role!=='parent')fail('forbidden');
  return repo.transaction(async tx=>{const invite=await tx.lockInvitation(hash);if(!invite||invite.state!=='pending'||invite.expiresAt<=now)fail('invalid_or_expired_invitation');if(!await tx.hasCaregiverPermission(actor.id,invite.childId,'manage_family'))fail('forbidden');if(await tx.childAccountHasProfile(invite.requestedBy)||await tx.profileHasChildAccount(invite.childId))fail('existing_child_link');await tx.linkChildAccount(invite.childId,invite.requestedBy);await tx.consumeInvitation(hash,now);return {status:'linked',childId:invite.childId}});
}
