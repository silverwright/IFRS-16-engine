import { Router, Request, Response } from 'express';
import { supabase } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { SavedContract } from '../types';
import { authenticateUser, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all contracts (filtered by user role)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let query = supabase.from('contracts').select('*');

    // Apply role-based filtering
    // Users can only see their own contracts
    // Approvers and admins can see all contracts
    if (userRole === 'user') {
      query = query.eq('created_by', userId);
    }
    // No additional filter needed for approvers and admins - they see all

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const contracts = (data || []).map(row => ({
      id: row.id,
      contractId: row.contract_id,
      lesseeName: row.lessee_name,
      lessorName: row.lessor_name || '',
      assetDescription: row.asset_description,
      commencementDate: row.commencement_date,
      mode: row.mode,
      status: row.status,
      data: row.data,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get single contract by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check access permissions
    // Users can only view their own contracts
    // Approvers and admins can view all contracts
    if (userRole === 'user' && data.created_by !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this contract' });
    }

    const contract = {
      id: data.id,
      contractId: data.contract_id,
      lesseeName: data.lessee_name,
      lessorName: data.lessor_name || '',
      assetDescription: data.asset_description,
      commencementDate: data.commencement_date,
      mode: data.mode,
      status: data.status,
      data: data.data,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Create new contract
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { contractId, lesseeName, assetDescription, commencementDate, mode, status, data } = req.body;

    // Validate required fields
    if (!contractId || !lesseeName || !assetDescription || !commencementDate || !mode || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if contract ID already exists
    const { data: existing } = await supabase
      .from('contracts')
      .select('id')
      .eq('contract_id', contractId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Contract ID already exists' });
    }

    const id = uuidv4();
    const { data: inserted, error } = await supabase
      .from('contracts')
      .insert({
        id,
        contract_id: contractId,
        lessee_name: lesseeName,
        asset_description: assetDescription,
        commencement_date: commencementDate,
        mode,
        status: status || 'draft', // Default to 'draft' instead of 'pending'
        data: data,
        created_by: userId // Always use authenticated user's ID
      })
      .select()
      .single();

    if (error) throw error;

    const contract = {
      id: inserted.id,
      contractId: inserted.contract_id,
      lesseeName: inserted.lessee_name,
      lessorName: inserted.lessor_name || '',
      assetDescription: inserted.asset_description,
      commencementDate: inserted.commencement_date,
      mode: inserted.mode,
      status: inserted.status,
      data: inserted.data,
      createdBy: inserted.created_by,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at
    };

    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// Update contract
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { contractId, lesseeName, assetDescription, commencementDate, mode, status, data } = req.body;

    // Check if contract exists and get ownership info
    const { data: existing } = await supabase
      .from('contracts')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check permissions: users and approvers can only update their own contracts, admins can update all
    if (userRole !== 'admin' && existing.created_by !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this contract' });
    }

    // Check if new contract ID conflicts with another contract
    if (contractId) {
      const { data: conflict } = await supabase
        .from('contracts')
        .select('id')
        .eq('contract_id', contractId)
        .neq('id', id)
        .single();

      if (conflict) {
        return res.status(409).json({ error: 'Contract ID already exists' });
      }
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (contractId) updates.contract_id = contractId;
    if (lesseeName) updates.lessee_name = lesseeName;
    if (assetDescription) updates.asset_description = assetDescription;
    if (commencementDate) updates.commencement_date = commencementDate;
    if (mode) updates.mode = mode;
    if (status) updates.status = status;
    if (data) updates.data = data;

    const { data: updated, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const contract = {
      id: updated.id,
      contractId: updated.contract_id,
      lesseeName: updated.lessee_name,
      lessorName: updated.lessor_name || '',
      assetDescription: updated.asset_description,
      commencementDate: updated.commencement_date,
      mode: updated.mode,
      status: updated.status,
      data: updated.data,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// Delete contract
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if contract exists and get ownership info
    const { data: existing } = await supabase
      .from('contracts')
      .select('id, created_by, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check permissions:
    // - Admins can delete any contract
    // - Users/approvers can only delete their own draft contracts
    if (userRole !== 'admin') {
      if (existing.created_by !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this contract' });
      }
      if (existing.status !== 'draft') {
        return res.status(403).json({ error: 'Only draft contracts can be deleted' });
      }
    }

    const { data, error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ message: 'Contract deleted successfully', id: data.id });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

// Bulk import contracts (for migration)
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { contracts } = req.body;

    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'Invalid contracts array' });
    }

    const inserted = [];
    const errors = [];

    for (const contract of contracts) {
      try {
        const id = contract.id || uuidv4();
        const { data, error } = await supabase
          .from('contracts')
          .upsert({
            id,
            contract_id: contract.contractId,
            lessee_name: contract.lesseeName,
            asset_description: contract.assetDescription,
            commencement_date: contract.commencementDate,
            mode: contract.mode,
            status: contract.status || 'draft',
            data: contract.data
          }, {
            onConflict: 'contract_id'
          })
          .select('id')
          .single();

        if (error) throw error;
        inserted.push(data.id);
      } catch (error) {
        errors.push({ contractId: contract.contractId, error: String(error) });
      }
    }

    res.json({
      message: 'Bulk import completed',
      inserted: inserted.length,
      errors: errors.length,
      details: errors
    });
  } catch (error) {
    console.error('Error bulk importing contracts:', error);
    res.status(500).json({ error: 'Failed to bulk import contracts' });
  }
});

// ===== APPROVAL WORKFLOW ENDPOINTS =====

// Submit contract for approval (draft -> pending)
router.patch('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { submittedBy } = req.body;

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft contracts can be submitted' });
    }

    const { data: updated, error } = await supabase
      .from('contracts')
      .update({
        status: 'pending',
        submitted_by: submittedBy,
        submitted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log to approval history
    await supabase.from('approval_history').insert({
      contract_id: id,
      user_id: submittedBy,
      action: 'submitted',
      from_status: 'draft',
      to_status: 'pending'
    });

    res.json({ message: 'Contract submitted for approval', contract: updated });
  } catch (error) {
    console.error('Error submitting contract:', error);
    res.status(500).json({ error: 'Failed to submit contract' });
  }
});

// Start review (pending -> under_review) - requires approver or admin role
router.patch('/:id/review', requireRole('approver', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.body;

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending contracts can be reviewed' });
    }

    const { data: updated, error } = await supabase
      .from('contracts')
      .update({
        status: 'under_review',
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log to approval history
    await supabase.from('approval_history').insert({
      contract_id: id,
      user_id: reviewerId,
      action: 'reviewed',
      from_status: 'pending',
      to_status: 'under_review'
    });

    res.json({ message: 'Review started', contract: updated });
  } catch (error) {
    console.error('Error starting review:', error);
    res.status(500).json({ error: 'Failed to start review' });
  }
});

// Approve contract (under_review -> approved) - requires approver or admin role
router.patch('/:id/approve', requireRole('approver', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approverId, approverEmail, approverName, notes } = req.body;

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'under_review' && contract.status !== 'pending') {
      return res.status(400).json({ error: 'Only contracts under review can be approved' });
    }

    const { data: updated, error } = await supabase
      .from('contracts')
      .update({
        status: 'approved',
        approver_id: approverId,
        approver_email: approverEmail,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log to approval history
    await supabase.from('approval_history').insert({
      contract_id: id,
      user_id: approverId,
      user_email: approverEmail,
      user_name: approverName,
      action: 'approved',
      from_status: contract.status,
      to_status: 'approved',
      comments: notes
    });

    res.json({ message: 'Contract approved', contract: updated });
  } catch (error) {
    console.error('Error approving contract:', error);
    res.status(500).json({ error: 'Failed to approve contract' });
  }
});

// Reject contract (under_review -> rejected) - requires approver or admin role
router.patch('/:id/reject', requireRole('approver', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approverId, approverEmail, approverName, reason } = req.body;

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'under_review' && contract.status !== 'pending') {
      return res.status(400).json({ error: 'Only contracts under review can be rejected' });
    }

    const { data: updated, error } = await supabase
      .from('contracts')
      .update({
        status: 'rejected',
        approver_id: approverId,
        approver_email: approverEmail,
        approver_name: approverName,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log to approval history
    await supabase.from('approval_history').insert({
      contract_id: id,
      user_id: approverId,
      user_email: approverEmail,
      user_name: approverName,
      action: 'rejected',
      from_status: contract.status,
      to_status: 'rejected',
      comments: reason
    });

    res.json({ message: 'Contract rejected', contract: updated });
  } catch (error) {
    console.error('Error rejecting contract:', error);
    res.status(500).json({ error: 'Failed to reject contract' });
  }
});

// Get approval history for a contract
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('approval_history')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
});

export default router;
