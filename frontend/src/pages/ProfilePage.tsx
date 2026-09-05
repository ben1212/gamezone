import React, { useState } from 'react';
import { UserProfile } from '../types';
import '../styles/Profile.css';

interface ProfilePageProps {
  user: UserProfile;
  onBack?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const initialLetter = (user.name || 'P').charAt(0).toUpperCase();
  const inviteLink = `https://t.me/gamezone_bot?start=${user.referralCode || 'GAMEZONE'}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Invitation link copied');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const details = [
    { label: 'Full Name', value: user.name || 'Player' },
    { label: 'Username', value: user.username || '@player' },
    { label: 'Phone Number', value: user.phone || 'Not set' },
  ];

  return (
    <div className="profile-page">
      {/* Main Profile Card */}
      <div className="profile-card">
        <div className="profile-header-row">
          <div className="avatar-box">
            <span>{initialLetter}</span>
          </div>

          <div className="profile-titles">
            <h2 className="profile-name">{user.name || 'Player'}</h2>
            <span className="profile-username">{user.username || '@player'}</span>
          </div>

          <div className="profile-status-badge">
            <span className="status-dot" />
            <span>Active</span>
          </div>
        </div>

        {/* Personal Details: Full Name, Username, Phone Number */}
        <div className="info-list">
          <div className="info-list-title">Personal Information</div>
          {details.map((item) => (
            <div className="info-row" key={item.label}>
              <span className="info-label">{item.label}</span>
              <span className="info-value">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Invitation Section */}
        <div className="invite-section">
          <div className="info-list-title">Invitation</div>

          {/* Invitation Link Box */}
          <div className="invite-link-row">
            <input
              type="text"
              className="invite-link-input"
              value={inviteLink}
              readOnly
            />
            <button
              className="invite-copy-btn"
              onClick={handleCopyLink}
              type="button"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Total Invited People Count In Number Only */}
          <div className="info-row">
            <span className="info-label">Total Invited</span>
            <span className="info-value">{user.totalReferrals || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
