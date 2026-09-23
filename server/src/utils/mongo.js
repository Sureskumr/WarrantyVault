/**
 * The server now uses a simple standalone MongoDB deployment and does its own
 * rollback/compensation logic when creating related records.
 */
export async function supportsTransactions() {
  return false;
}

export default { supportsTransactions };
