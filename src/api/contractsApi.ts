import { SavedContract, LeaseData } from '../context/LeaseContext';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Helper function to get authorization headers with current user's token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export const contractsApi = {
  // Get all contracts
  async getAll(): Promise<SavedContract[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch contracts');
    }
    return response.json();
  },

  // Get single contract by ID
  async getById(id: string): Promise<SavedContract> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts/${id}`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch contract');
    }
    return response.json();
  },

  // Create new contract
  async create(contract: Omit<SavedContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedContract> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(contract),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contract');
    }
    return response.json();
  },

  // Update contract
  async update(id: string, contract: Partial<SavedContract>): Promise<SavedContract> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(contract),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contract');
    }
    return response.json();
  },

  // Delete contract
  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error('Failed to delete contract');
    }
  },

  // Bulk import contracts (for migration)
  async bulkImport(contracts: SavedContract[]): Promise<{ inserted: number; errors: number }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contracts }),
    });
    if (!response.ok) {
      throw new Error('Failed to bulk import contracts');
    }
    return response.json();
  },

  // Check API health
  async health(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return response.json();
  },

  // Create a modification (new version) of an existing contract
  async createModification(
    id: string,
    modificationDate: string,
    newValues: Partial<LeaseData>,
    modificationReason?: string,
    modificationType?: 'amendment' | 'termination',
    agreementDate?: string
  ): Promise<SavedContract> {
    const headers = await getAuthHeaders();
    console.log('Creating modification:', {
      id,
      modificationDate,
      newValues,
      modificationReason,
      modificationType,
      agreementDate,
      url: `${API_BASE_URL}/contracts/${id}/modify`
    });

    const response = await fetch(`${API_BASE_URL}/contracts/${id}/modify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        modificationDate,
        data: newValues,
        modificationReason,
        modificationType: modificationType || 'amendment',
        agreementDate: agreementDate || modificationDate,
      }),
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error || 'Failed to create contract modification');
      } catch (e) {
        throw new Error(`Failed to create contract modification: ${response.status} ${response.statusText}`);
      }
    }
    return response.json();
  },

  // Get all versions of a contract
  async getVersions(baseContractId: string): Promise<SavedContract[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/contracts/versions/${baseContractId}`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch contract versions');
    }
    return response.json();
  },
};
