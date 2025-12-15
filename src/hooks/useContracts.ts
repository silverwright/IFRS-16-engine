import { useEffect, useCallback } from 'react';
import { useLeaseContext, SavedContract } from '../context/LeaseContext';
import { contractsApi } from '../api/contractsApi';

export function useContracts() {
  const { state, dispatch } = useLeaseContext();

  // Load all contracts from API on mount
  useEffect(() => {
    const loadContracts = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const contracts = await contractsApi.getAll();
        dispatch({ type: 'LOAD_ALL_CONTRACTS', payload: contracts });
      } catch (error) {
        console.error('Failed to load contracts:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load contracts from server' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadContracts();
  }, [dispatch]);

  // Save a new contract
  const saveContract = useCallback(async (contract: Omit<SavedContract, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const savedContract = await contractsApi.create(contract);
      dispatch({ type: 'SAVE_CONTRACT', payload: savedContract });
      return savedContract;
    } catch (error) {
      console.error('Failed to save contract:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save contract' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Update an existing contract
  const updateContract = useCallback(async (id: string, updates: Partial<SavedContract>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedContract = await contractsApi.update(id, updates);
      dispatch({ type: 'UPDATE_CONTRACT', payload: updatedContract });
      return updatedContract;
    } catch (error) {
      console.error('Failed to update contract:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update contract' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Delete a contract
  const deleteContract = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await contractsApi.delete(id);
      dispatch({ type: 'DELETE_CONTRACT', payload: id });
    } catch (error) {
      console.error('Failed to delete contract:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete contract' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Manually reload contracts
  const loadContracts = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const contracts = await contractsApi.getAll();
      dispatch({ type: 'LOAD_ALL_CONTRACTS', payload: contracts });
    } catch (error) {
      console.error('Failed to load contracts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load contracts from server' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  return {
    contracts: state.savedContracts,
    loading: state.loading,
    error: state.error,
    saveContract,
    updateContract,
    deleteContract,
    loadContracts,
  };
}
