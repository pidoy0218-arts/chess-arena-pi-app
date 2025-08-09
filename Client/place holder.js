// Replace with official Pi APIs when available.

export async function authenticateWithPi() {
  // TODO: integrate Pi login flow
  return { piId: 'user_pi_id' };
}

export async function getPiBalance(piId) {
  // TODO: call Pi API to fetch balance
  return 0;
}

export async function transferPi(fromPiId, toPiId, amount) {
  // TODO: call Pi wallet transfer API
  console.log(`Pretend transfer ${amount} Pi from ${fromPiId} to ${toPiId}`);
  return { success: true };
}
