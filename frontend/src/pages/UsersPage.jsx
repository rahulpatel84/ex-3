import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as householdService from '../services/householdService';
import Sidebar from '../components/Sidebar';

const UsersPage = () => {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadHousehold();
  }, [user]);

  const loadHousehold = async () => {
    try {
      setLoading(true);
      
      console.log('🏠 Loading household for user:', { userId: user?.id, currentHouseholdId: user?.currentHouseholdId });
      
      if (user?.currentHouseholdId) {
        const data = await householdService.getHousehold(user.currentHouseholdId);
        console.log('🏠 Household data received:', JSON.stringify(data, null, 2));
        console.log('🏠 Members in response:', data?.members?.length || 0);
        console.log('🏠 Active members:', data?.members?.filter(m => m.status === 'active')?.length || 0);
        setHousehold(data);
      } else {
        console.log('⚠️ No currentHouseholdId for user');
      }
      // If no household, just show empty state - don't auto-create
    } catch (error) {
      console.error('Failed to load household:', error);
      showMessage('error', 'Failed to load household members');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      await householdService.inviteMember(user.currentHouseholdId, {
        email: inviteEmail,
        role: inviteRole,
      });
      
      showMessage('success', `Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      loadHousehold();
    } catch (error) {
      showMessage('error', error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await householdService.updateMemberRole(user.currentHouseholdId, memberId, newRole);
      showMessage('success', 'Member role updated successfully');
      loadHousehold();
    } catch (error) {
      showMessage('error', error.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this household?`)) {
      return;
    }

    try {
      await householdService.removeMember(user.currentHouseholdId, memberId);
      showMessage('success', 'Member removed successfully');
      loadHousehold();
    } catch (error) {
      showMessage('error', error.message || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentUserRole = () => {
    console.log('🔍 Getting user role:', { 
      userId: user?.id, 
      members: household?.members?.map(m => ({ id: m.id, userId: m.userId, role: m.role, status: m.status }))
    });
    const member = household?.members?.find(m => m.userId === user?.id);
    console.log('🔍 Found member:', member);
    return member?.role || 'member';
  };

  const canManageMembers = () => {
    const role = getCurrentUserRole();
    // If no household members yet, allow the user to manage (they're the creator)
    if (!household?.members || household.members.length === 0) {
      return true;
    }
    return role === 'owner' || role === 'admin';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-2">
              Manage household members and invitations
            </p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Household Info & Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {household?.name || 'My Household'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {household?.description || 'Manage your household members'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm text-gray-500">
                    {household?.members?.filter(m => m.status === 'active').length || 0} members
                  </span>
                  <span className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(getCurrentUserRole())}`}>
                      Your Role: {getCurrentUserRole()}
                    </span>
                  </span>
                </div>
              </div>
              {canManageMembers() && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Member
                </button>
              )}
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  {canManageMembers() && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {household?.members?.filter(m => m.status === 'active').map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {member.user.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.fullName}
                            {member.userId === user?.id && (
                              <span className="ml-2 text-xs text-gray-500">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{member.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageMembers() && member.role !== 'owner' && member.userId !== user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleBadgeColor(member.role)}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.acceptedAt ? new Date(member.acceptedAt).toLocaleDateString() : '-'}
                    </td>
                    {canManageMembers() && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {member.role !== 'owner' && member.userId !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.user.fullName)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {household?.members?.filter(m => m.status === 'active').length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No members</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by inviting a member.</p>
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {household?.invitations?.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h3>
              <div className="space-y-3">
                {household.invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-500">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()} • Expires{' '}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                      {invitation.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h3>
            <form onSubmit={handleInviteMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="member@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="admin">Admin - Can manage members and all expenses</option>
                    <option value="member">Member - Can add and manage expenses</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

