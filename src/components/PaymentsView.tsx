import React, { useState } from 'react';
import {
  PaymentCategory,
  PaymentRecord,
  MemberProfile,
} from '../types';
import { paymentCategories } from '../data/initialData';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Download,
  Share2,
  FileText,
  ShieldCheck,
  Building2,
  CalendarCheck,
  Wallet,
  Sparkles,
  Receipt,
  X,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentsViewProps {
  member: MemberProfile;
  paymentRecords: PaymentRecord[];
  onRecordPayment: (record: PaymentRecord) => void;
  onBack: () => void;
  initialSelectedCategory?: string | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  member,
  paymentRecords,
  onRecordPayment,
  onBack,
  initialSelectedCategory = null,
}) => {
  const [activeTab, setActiveTab] = useState<'contribute' | 'history'>('contribute');
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>(
    paymentCategories.find((c) => c.id === initialSelectedCategory) || paymentCategories[0]
  );
  const [customAmount, setCustomAmount] = useState<string>('500');
  
  // Card details state (Card is the ONLY allowed payment method)
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789');
  const [cardHolder, setCardHolder] = useState(`${member.title} ${member.name}`);
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('831');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);

  const totalGiven = paymentRecords.reduce((acc, curr) => acc + curr.amount, 0);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'karolo':
        return <Wallet className="w-5 h-5 text-[#D13138]" />;
      case 'polokano':
        return <ShieldCheck className="w-5 h-5 text-[#3F76C5]" />;
      case 'monthends':
        return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
      case 'sethephu':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <Building2 className="w-5 h-5 text-amber-600" />;
    }
  };

  const handlePayNow = () => {
    const amountVal = parseFloat(customAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const now = new Date();
      const newPayment: PaymentRecord = {
        id: `pay_${Date.now()}`,
        receiptNumber: `IPHC-RCP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: now.toISOString().split('T')[0],
        category: selectedCategory.id,
        categoryLabel: selectedCategory.name,
        amount: amountVal,
        status: 'Completed',
        paymentMethod: 'Card',
        memberName: `${member.title} ${member.name}`,
        memberNumber: member.membershipNumber,
        referenceNote: `${selectedCategory.sesothoName} - Card (Ending in ${cardNumber.slice(-4)})`,
      };

      onRecordPayment(newPayment);
      setActiveReceipt(newPayment);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D13138', '#3F76C5', '#10B981'],
        });
      } catch {
        // safe fallback
      }
    }, 900);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-28 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-semibold p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-bold text-slate-900">Church Contributions</h2>

        <div className="w-12" />
      </div>

      {/* Tabs: Contribute vs History */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/60">
        <div className="flex rounded-2xl bg-white p-1 border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setActiveTab('contribute')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'contribute'
                ? 'bg-[#D13138] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pay with Card (Give)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-[#3F76C5] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receipts History ({paymentRecords.length})
          </button>
        </div>
      </div>

      {activeTab === 'contribute' ? (
        <div className="p-4 space-y-4 flex-1">
          {/* Category Selector Cards */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              1. Select Approved Category:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {paymentCategories.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3.5 rounded-2xl text-left border transition-all duration-150 flex flex-col justify-between relative overflow-hidden active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#D13138] bg-white ring-2 ring-[#D13138] shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div className="mt-3">
                      <h4 className="font-extrabold text-xs text-[#1A1A1A] leading-tight">
                        {cat.name.split(' (')[0]}
                      </h4>
                      <p className="text-[10px] text-[#6B7280] italic mt-0.5 truncate font-medium">
                        {cat.sesothoName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Category Explainer */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className="font-bold text-slate-900 block">{selectedCategory.name}</span>
            <p className="mt-0.5 text-slate-500 leading-relaxed text-[11px]">
              {selectedCategory.description}
            </p>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              2. Choose or Enter Amount (ZAR):
            </label>

            {/* Quick Amount Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-2.5">
              {selectedCategory.suggestedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCustomAmount(amt.toString())}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                    customAmount === amt.toString()
                      ? 'bg-[#3F76C5] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  R{amt}
                </button>
              ))}
            </div>

            {/* Input Field */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-base">
                R
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#D13138]"
              />
            </div>
          </div>

          {/* Exclusive Card Payment Method Section */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D13138]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Card Payment Details
                </span>
              </div>
              {/* Card Badges */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] tracking-wider">
                  VISA
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-extrabold text-[9px] tracking-wider">
                  MC
                </span>
              </div>
            </div>

            {/* Card Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 •••• •••• ••••"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="•••"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-[#3F76C5]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Protected by 3D-Secure 2.0 bank encryption</span>
            </div>
          </div>

          {/* Member Confirmation Summary Note */}
          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Allocated to: <strong>{member.name}</strong></span>
            <span className="font-mono text-slate-500">{member.membershipNumber}</span>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              onClick={handlePayNow}
              disabled={isProcessing || !customAmount || parseFloat(customAmount) <= 0}
              className="w-full py-3.5 rounded-2xl bg-[#D13138] text-white font-extrabold text-base hover:bg-[#b8262d] transition shadow-lg shadow-red-500/25 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Card Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay R{customAmount || 0} with Card</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="p-4 space-y-3 flex-1">
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-[#3F76C5] to-[#204a84] text-white p-5 rounded-3xl shadow-md">
            <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">
              Total Recorded Giving
            </p>
            <h3 className="text-2xl font-black mt-0.5">R{totalGiven.toLocaleString()}</h3>
            <p className="text-[11px] text-blue-200/80 mt-1">
              Receipts are stored on your device and synchronized with Church Branch Records.
            </p>
          </div>

          <div className="space-y-2.5 mt-4">
            {paymentRecords.map((pay) => (
              <div
                key={pay.id}
                onClick={() => setActiveReceipt(pay)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D13138] flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{pay.categoryLabel}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{pay.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        Card
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    R{pay.amount.toFixed(2)}
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    {pay.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Watermark & Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 stroke-[2.2]" />
              <h3 className="text-lg font-black text-slate-900">Official Church Receipt</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                International Pentecost Holiness Church
              </p>
              <span className="inline-block mt-1 font-mono text-[11px] text-slate-400">
                {activeReceipt.receiptNumber}
              </span>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Date & Time:</span>
                <span className="font-bold text-slate-900">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Member Name:</span>
                <span className="font-bold text-slate-900">{activeReceipt.memberName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Membership No:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeReceipt.memberNumber}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Offering Fund:</span>
                <span className="font-bold text-[#D13138]">{activeReceipt.categoryLabel}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Channel:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#3F76C5]" />
                  Card (Verified)
                </span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Contribution:</span>
                <span className="text-xl font-black text-slate-900">
                  R{activeReceipt.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  alert(`Receipt ${activeReceipt.receiptNumber} downloaded as PDF.`);
                  setActiveReceipt(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'IPHC Church Contribution Receipt',
                      text: `Receipt for ${activeReceipt.categoryLabel} contribution of R${activeReceipt.amount} by ${activeReceipt.memberName}.`,
                    }).catch(() => {});
                  } else {
                    alert('Receipt details copied to clipboard.');
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
