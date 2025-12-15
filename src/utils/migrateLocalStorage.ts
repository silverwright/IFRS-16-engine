import { SavedContract } from '../context/LeaseContext';
import { contractsApi } from '../api/contractsApi';

const STORAGE_KEY = 'ifrs16_contracts';

/**
 * Migrate contracts from localStorage to backend API
 */
export async function migrateLocalStorageToBackend(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  try {
    // Check if localStorage has any contracts
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      return {
        success: true,
        migratedCount: 0,
        errors: ['No contracts found in localStorage'],
      };
    }

    const localContracts: SavedContract[] = JSON.parse(localData);
    if (!Array.isArray(localContracts) || localContracts.length === 0) {
      return {
        success: true,
        migratedCount: 0,
        errors: ['No valid contracts to migrate'],
      };
    }

    console.log(`Found ${localContracts.length} contracts in localStorage`);

    // Bulk import to backend
    const result = await contractsApi.bulkImport(localContracts);

    // If successful, create a backup in localStorage and clear the original
    if (result.inserted > 0) {
      const backupKey = `${STORAGE_KEY}_backup_${new Date().toISOString()}`;
      localStorage.setItem(backupKey, localData);
      localStorage.removeItem(STORAGE_KEY);

      console.log(`✅ Migration complete: ${result.inserted} contracts migrated`);
      console.log(`📦 Backup created at key: ${backupKey}`);
    }

    return {
      success: true,
      migratedCount: result.inserted,
      errors: result.errors > 0 ? [`${result.errors} contracts had errors`] : [],
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migratedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Check if there are contracts in localStorage that need migration
 */
export function hasLocalStorageContracts(): boolean {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (!localData) return false;

  try {
    const contracts = JSON.parse(localData);
    return Array.isArray(contracts) && contracts.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get count of contracts in localStorage
 */
export function getLocalStorageContractCount(): number {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (!localData) return 0;

  try {
    const contracts = JSON.parse(localData);
    return Array.isArray(contracts) ? contracts.length : 0;
  } catch {
    return 0;
  }
}
