import React, { useState } from 'react';
import { Modal } from './Modal';
import { ActiveModal, Transaction, UserProfile, WalletBalances } from '../types';
import { TransactionItem } from './TransactionItem';
import { api } from '../services/api';

interface QuickActionModalProps {
  activeModal: ActiveModal;
  onClose: () => void;
  balances: WalletBalances;
  onUpdateBalances: (newBalances: WalletBalances, newTx?: Transaction) => void;
  user?: UserProfile;
  transactions: Transaction[];
  onShowToast: (msg: string) => void;
}

const PAYMENT_ACCOUNTS = {
  telebirr: {
    name: 'Telebirr',
    number: '0911002233',
    accountName: 'GameZone',
    typeLabel: 'Merchant / Mobile Number',
  },
  cbe_birr: {
    name: 'CBE Birr',
    number: '1000192837465',
    accountName: 'GameZone',
    typeLabel: 'CBE Account / CBE Birr',
  },
};

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  activeModal,
  onClose,
  balances,
  onUpdateBalances,
  transactions,
  onShowToast,
}) => {
  // Deposit States
  const [depositStep, setDepositStep] = useState<1 | 2>(1);
  const [depositMethod, setDepositMethod] = useState<'telebirr' | 'cbe_birr'>('telebirr');
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [referenceSms, setReferenceSms] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);

  // Withdraw States
  const [withdrawMethod, setWithdrawMethod] = useState<'telebirr' | 'cbe_birr'>('telebirr');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAccount, setWithdrawAccount] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeModal || activeModal.type === 'game') return null;

  const handleClose = () => {
    setDepositStep(1);
    setErrorMsg(null);
    setReferenceSms('');
    onClose();
  };

  // 1. DEPOSIT MODAL (2-step flow)
  if (activeModal.type === 'deposit') {
    const amt = Number(depositAmount);
    const selectedAccount = PAYMENT_ACCOUNTS[depositMethod];

    const handleNextStep = () => {
      if (!amt || amt < 10) {
        setErrorMsg('Minimum deposit amount is 10 ETB');
        return;
      }
      setErrorMsg(null);
      setDepositStep(2);
    };

    const handleCopyPaymentNumber = () => {
      navigator.clipboard?.writeText(selectedAccount.number);
      setCopiedNumber(true);
      onShowToast(`${selectedAccount.name} number copied`);
      setTimeout(() => setCopiedNumber(false), 2000);
    };

    const handleConfirmDeposit = async () => {
      if (!referenceSms.trim()) {
        setErrorMsg('Please enter transaction reference number or SMS');
        return;
      }
      setErrorMsg(null);

      const serverResult = await api.deposit(amt, depositMethod, referenceSms.trim());
      if (serverResult && serverResult.balances && serverResult.transaction) {
        onUpdateBalances(serverResult.balances, serverResult.transaction);
        onShowToast(`Deposit of ${amt} ${balances.currency} submitted for verification`);
        handleClose();
        return;
      }

      // Offline / Local update
      const newPlayable = balances.playable + amt;
      const newTotal = balances.withdrawable + newPlayable;

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        title: `Deposit (${selectedAccount.name})`,
        meta: `Ref: ${referenceSms.trim()}`,
        amount: amt,
        currency: balances.currency,
        type: 'positive',
        icon: '↓',
        timestamp: new Date().toISOString(),
      };

      onUpdateBalances(
        {
          ...balances,
          total: newTotal,
          playable: newPlayable,
        },
        newTx
      );

      onShowToast(`Deposit of ${amt} ${balances.currency} submitted for verification`);
      handleClose();
    };

    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        title={depositStep === 1 ? 'Deposit Funds' : 'Send Payment'}
        subtitle={depositStep === 1 ? 'Choose Telebirr or CBE Birr' : `Transfer to GameZone ${selectedAccount.name}`}
      >
        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        {depositStep === 1 ? (
          <div>
            {/* Step 1: Choose Method */}
            <div className="input-group">
              <label className="input-label">Payment Method</label>
              <div className="method-grid">
                <button
                  type="button"
                  className={`method-card ${depositMethod === 'telebirr' ? 'active' : ''}`}
                  onClick={() => setDepositMethod('telebirr')}
                >
                  <span className="method-card-name">Telebirr</span>
                  <span className="method-card-sub">Instant Transfer</span>
                </button>

                <button
                  type="button"
                  className={`method-card ${depositMethod === 'cbe_birr' ? 'active' : ''}`}
                  onClick={() => setDepositMethod('cbe_birr')}
                >
                  <span className="method-card-name">CBE Birr</span>
                  <span className="method-card-sub">Bank Account</span>
                </button>
              </div>
            </div>

            {/* Step 1: Enter Amount */}
            <div className="input-group">
              <label className="input-label">Amount (ETB)</label>
              <input
                type="number"
                className="input-field"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="100"
                min="10"
              />
              <div className="quick-pills">
                {['50', '100', '200', '500', '1000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-pill ${depositAmount === val ? 'active' : ''}`}
                    onClick={() => {
                      setDepositAmount(val);
                      setErrorMsg(null);
                    }}
                  >
                    {val} ETB
                  </button>
                ))}
              </div>
            </div>

            <button className="modal-submit-btn" onClick={handleNextStep} type="button">
              Continue to Payment
            </button>
          </div>
        ) : (
          <div>
            {/* Step 2: Payment Account Details */}
            <div className="payment-account-box">
              <div className="payment-account-row">
                <span className="payment-account-label">{selectedAccount.typeLabel}</span>
                <div className="payment-account-val">
                  <span>{selectedAccount.number}</span>
                  <button className="copy-mini-btn" onClick={handleCopyPaymentNumber} type="button">
                    {copiedNumber ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="payment-account-row">
                <span className="payment-account-label">Account Name</span>
                <span className="payment-account-val">{selectedAccount.accountName}</span>
              </div>

              <div className="payment-account-row">
                <span className="payment-account-label">Amount to Send</span>
                <span className="payment-account-val" style={{ color: 'var(--emerald)' }}>
                  {amt} ETB
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Transfer <strong>{amt} ETB</strong> using your {selectedAccount.name} app. Once sent, paste the transaction reference ID or confirmation SMS below:
            </p>

            {/* Step 2: Reference SMS Input */}
            <div className="input-group">
              <label className="input-label">Transaction Reference / SMS</label>
              <input
                type="text"
                className="input-field"
                value={referenceSms}
                onChange={(e) => {
                  setReferenceSms(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. CI498X7Y2Z or confirmation SMS"
              />
            </div>

            <button className="modal-submit-btn" onClick={handleConfirmDeposit} type="button">
              Submit Proof
            </button>

            <button className="modal-back-link" onClick={() => setDepositStep(1)} type="button">
              ← Change amount or method
            </button>
          </div>
        )}
      </Modal>
    );
  }

  // 2. WITHDRAW MODAL
  if (activeModal.type === 'withdraw') {
    const handleConfirmWithdraw = async () => {
      const amt = Number(withdrawAmount);
      if (!amt || amt <= 0) {
        setErrorMsg('Please enter a valid amount');
        return;
      }

      if (amt > balances.withdrawable) {
        setErrorMsg(`Maximum available: ${balances.withdrawable} ${balances.currency}`);
        return;
      }

      if (!withdrawAccount.trim()) {
        setErrorMsg('Please enter your receiving account / phone number');
        return;
      }
      setErrorMsg(null);

      const serverResult = await api.withdraw(amt, withdrawAccount.trim());
      if (serverResult && serverResult.balances && serverResult.transaction) {
        onUpdateBalances(serverResult.balances, serverResult.transaction);
        onShowToast(`Withdrawal of ${amt} ${balances.currency} initiated`);
        handleClose();
        return;
      }

      // Offline / Local update
      const newWithdrawable = balances.withdrawable - amt;
      const newTotal = balances.playable + newWithdrawable;

      const methodName = withdrawMethod === 'cbe_birr' ? 'CBE Birr' : 'Telebirr';
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        title: `Withdrawal (${methodName})`,
        meta: `To: ${withdrawAccount.trim()}`,
        amount: amt,
        currency: balances.currency,
        type: 'negative',
        icon: '↑',
        timestamp: new Date().toISOString(),
      };

      onUpdateBalances(
        {
          ...balances,
          total: newTotal,
          withdrawable: newWithdrawable,
        },
        newTx
      );

      onShowToast(`Withdrawal of ${amt} ${balances.currency} initiated`);
      handleClose();
    };

    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Withdraw Funds"
        subtitle={`Available: ${balances.withdrawable > 0 ? `${balances.withdrawable.toLocaleString()} ${balances.currency}` : `0 ${balances.currency}`}`}
      >
        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <div className="input-group">
          <label className="input-label">Payout Method</label>
          <div className="method-grid">
            <button
              type="button"
              className={`method-card ${withdrawMethod === 'telebirr' ? 'active' : ''}`}
              onClick={() => setWithdrawMethod('telebirr')}
            >
              <span className="method-card-name">Telebirr</span>
              <span className="method-card-sub">Mobile Account</span>
            </button>

            <button
              type="button"
              className={`method-card ${withdrawMethod === 'cbe_birr' ? 'active' : ''}`}
              onClick={() => setWithdrawMethod('cbe_birr')}
            >
              <span className="method-card-name">CBE Birr</span>
              <span className="method-card-sub">Bank Account</span>
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Amount ({balances.currency})</label>
          <input
            type="number"
            className="input-field"
            value={withdrawAmount}
            onChange={(e) => {
              setWithdrawAmount(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="0.00"
            max={balances.withdrawable}
            min="10"
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            {withdrawMethod === 'telebirr' ? 'Telebirr Phone Number' : 'CBE Account Number'}
          </label>
          <input
            type="text"
            className="input-field"
            value={withdrawAccount}
            onChange={(e) => {
              setWithdrawAccount(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={withdrawMethod === 'telebirr' ? '09...' : '1000...'}
          />
        </div>

        <button
          className="modal-submit-btn"
          onClick={handleConfirmWithdraw}
          disabled={balances.withdrawable <= 0}
          type="button"
        >
          Confirm Withdrawal
        </button>
      </Modal>
    );
  }

  // 3. ALL TRANSACTIONS MODAL
  if (activeModal.type === 'allTransactions') {
    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Transaction History"
        subtitle="All account deposits and withdrawals"
      >
        {transactions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '320px', overflowY: 'auto' }}>
            {transactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '28px', opacity: 0.4 }}>📜</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No Transactions
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Activity will appear here as you deposit and withdraw.
            </div>
          </div>
        )}

        <button className="modal-submit-btn" onClick={handleClose} type="button" style={{ marginTop: '16px' }}>
          Close
        </button>
      </Modal>
    );
  }

  return null;
};
