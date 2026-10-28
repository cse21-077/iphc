import React, { useState } from 'react';
import {
  PaymentCategory,
  PaymentRecord,
  MemberProfile,
} from '../types';
import { paymentCategories } from '../data/initialData';
import { useTranslation } from '../data/i18n';
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

  const { t } = useTranslation();

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
    <div className="min-h-[calc(100vh-8rem)] flex flex-col pb-28 max-w-md mx-auto space-y-4 px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black p-1.5 rounded-full bg-slate-100 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <h2 className="text-lg font-black text-[#181D20] tracking-tight">{t('payments.churchGiving')}</h2>

        <div className="w-16" />
      </div>

      {/* Segmented Control Tabs */}
      <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-xs flex">
        <button
          onClick={() => setActiveTab('contribute')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 ${
            activeTab === 'contribute'
              ? 'bg-[#181D20] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('payments.cardGiving')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 ${
            activeTab === 'history'
              ? 'bg-[#181D20] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('payments.receipts', { count: paymentRecords.length })}
        </button>
      </div>

      {activeTab === 'contribute' ? (
        <div className="space-y-4 flex-1">
          {/* Category Selector Grid */}
          <div className="bg-white rounded-[26px] p-4 border border-slate-200/90 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {t('payments.stepCategory')}
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {paymentCategories.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3.5 rounded-[20px] text-left border transition-all duration-150 flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#181D20] bg-slate-900 text-white ring-1 ring-[#181D20] shadow-md'
                        : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 text-slate-900'
                    }`}
                  >
                    <div>
                      {cat.id === 'karolo' && <Wallet className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />}
                      {cat.id === 'polokano' && <ShieldCheck className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />}
                      {cat.id === 'monthends' && <CalendarCheck className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />}
                      {cat.id === 'sethephu' && <Sparkles className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />}
                      {cat.id !== 'karolo' && cat.id !== 'polokano' && cat.id !== 'monthends' && cat.id !== 'sethephu' && (
                        <Building2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />
                      )}
                    </div>
                    <div className="mt-3">
                      <h4 className="font-extrabold text-xs leading-tight">
                        {cat.name.split(' (')[0]}
                      </h4>
                      <p className={`text-[10px] italic mt-0.5 truncate font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {cat.sesothoName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Category Explainer */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">{selectedCategory.name}</span>
              <p className="mt-0.5 text-slate-500 leading-relaxed text-[11px]">
                {selectedCategory.description}
              </p>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="bg-white rounded-[26px] p-4 border border-slate-200/90 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {t('payments.stepAmount')}
            </span>

            {/* Quick Amount Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {selectedCategory.suggestedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCustomAmount(amt.toString())}
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition active:scale-95 ${
                    customAmount === amt.toString()
                      ? 'bg-[#181D20] text-white shadow-xs'
                      : 'bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200/60'
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
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-lg font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
              />
            </div>
          </div>

          {/* Card Payment Method Section */}
          <div className="bg-white rounded-[26px] p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#181D20]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  {t('payments.cardDetails')}
                </span>
              </div>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t('payments.cardNumber')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 •••• •••• ••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t('payments.cardholderName')}
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t('payments.expiry')}
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-mono text-xs font-bold text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CVV / CVC
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="•••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-mono text-xs font-bold text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-[#181D20]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t('payments.secureNote')}</span>
            </div>
          </div>

          {/* Member Confirmation Summary Note */}
          <div className="p-3 rounded-2xl bg-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>{t('payments.allocatedTo')} <strong>{member.name}</strong></span>
            <span className="font-mono text-slate-500 font-bold">{member.membershipNumber}</span>
          </div>

          {/* Submit Action */}
          <div className="pt-1">
            <button
              onClick={handlePayNow}
              disabled={isProcessing || !customAmount || parseFloat(customAmount) <= 0}
              className="w-full py-3.5 rounded-full bg-[#181D20] text-white font-extrabold text-sm hover:bg-black transition shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('payments.processing')}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>{t('payments.giveButton', { amount: customAmount || 0 })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="space-y-3 flex-1">
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-[#181D20] to-[#2B3237] text-white p-5 rounded-[26px] shadow-md">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t('payments.totalGiving')}
            </p>
            <h3 className="text-2xl font-black mt-0.5">R{totalGiven.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-300/80 mt-1">
              {t('payments.historyNote')}
            </p>
          </div>

          <div className="space-y-2.5 mt-4">
            {paymentRecords.map((pay) => (
              <div
                key={pay.id}
                onClick={() => setActiveReceipt(pay)}
                className="p-4 rounded-[22px] bg-white border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-400 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Receipt className="w-5 h-5 text-[#181D20] shrink-0 stroke-[2]" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{pay.categoryLabel}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{pay.date}</span>
                      <span>•</span>
                      <span>{t('payments.methodCard')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    R{pay.amount.toFixed(2)}
                  </span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
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
              <h3 className="text-lg font-black text-slate-900">{t('payments.officialReceipt')}</h3>
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
                <span>{t('payments.dateTime')}</span>
                <span className="font-bold text-slate-900">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('payments.memberName')}</span>
                <span className="font-bold text-slate-900">{activeReceipt.memberName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('payments.membershipNo')}</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeReceipt.memberNumber}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('payments.offeringFund')}</span>
                <span className="font-bold text-[#D13138]">{activeReceipt.categoryLabel}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('payments.channel')}</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#3F76C5]" />
                  {t('payments.cardVerified')}
                </span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">{t('payments.totalContribution')}</span>
                <span className="text-xl font-black text-slate-900">
                  R{activeReceipt.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  alert(t('payments.alertDownloaded', { number: activeReceipt.receiptNumber }));
                  setActiveReceipt(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
                <span>{t('payments.savePdf')}</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: t('payments.shareTitle'),
                      text: t('payments.shareText', {
                        category: activeReceipt.categoryLabel,
                        amount: activeReceipt.amount,
                        name: activeReceipt.memberName,
                      }),
                    }).catch(() => {});
                  } else {
                    alert(t('payments.alertCopied'));
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                title={t('payments.share')}
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
