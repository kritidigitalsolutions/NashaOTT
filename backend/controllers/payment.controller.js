const crypto = require('crypto');
const { sabpaisaClient, generateChecksum, SABPAISA_MERCHANT_ID } = require('../config/sabPaisa');
const Plan = require('../models/plan.model');
const Promo = require('../models/promocode.model');
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const PaymentTransaction = require('../models/paymentTransaction.model');
const { expireSubscriptionIfNeeded } = require('../utils/subscription.helper');
const { sendMetaEvent } = require('../services/metaCapi.service');

const successfulStatuses = new Set(['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED', 'CAPTURED']);
const failedStatuses = new Set(['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'EXPIRED']);
const getValue = (source, ...keys) => keys.map((key) => source?.[key]).find((value) => value !== undefined && value !== null && value !== '');
const paymentLog = (step, details = {}) => console.log(`[PAYMENT] ${new Date().toISOString()} ${step}`, details);

// Safe when SabPaisa retries a webhook or the browser checks the same payment twice.
const activateSubscription = async (transaction, gatewayPayload = {}) => {
  paymentLog('SUBSCRIPTION_ACTIVATION_STARTED', { merchantTxnId: transaction.merchantTxnId, paymentId: transaction.paymentId, userId: transaction.user.toString() });
  const existing = await Subscription.findOne({ paymentId: transaction.paymentId });
  if (existing) {
    transaction.status = 'paid';
    transaction.subscription = existing._id;
    transaction.gatewayPayload = gatewayPayload;
    await transaction.save();
    paymentLog('SUBSCRIPTION_ALREADY_ACTIVE', { merchantTxnId: transaction.merchantTxnId, subscriptionId: existing._id.toString() });
    return existing;
  }

  let active = await Subscription.findOne({ user: transaction.user, status: 'active' });
  active = await expireSubscriptionIfNeeded(active);
  if (active?.status === 'active') throw new Error('User already has an active subscription');

  const plan = await Plan.findById(transaction.plan);
  if (!plan) throw new Error('Plan no longer exists');

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + plan.duration);
  const subscription = await Subscription.create({
    user: transaction.user,
    plan: plan._id,
    status: 'active',
    paymentId: transaction.paymentId,
    subscriptionId: transaction.merchantTxnId,
    amount: transaction.amount,
    currency: transaction.currency,
    startDate,
    endDate,
  });

  if (transaction.promoCode) {
    await Promo.updateOne({ code: transaction.promoCode, isActive: true }, { $inc: { usedCount: 1 } });
  }
  transaction.status = 'paid';
  transaction.subscription = subscription._id;
  transaction.gatewayPayload = gatewayPayload;
  await transaction.save();
  paymentLog('SUBSCRIPTION_ACTIVATED', { merchantTxnId: transaction.merchantTxnId, subscriptionId: subscription._id.toString(), planId: plan._id.toString(), endDate: endDate.toISOString() });
  return subscription;
};

// Direct server-to-server enquiry with SabPaisa to verify and synchronize transaction status
const syncTransactionWithSabPaisa = async (transaction) => {
  if (!transaction || !transaction.paymentId) {
    return { success: false, message: 'Missing paymentId on transaction' };
  }

  // If already paid, return active subscription
  if (transaction.status === 'paid' && transaction.subscription) {
    const existingSub = await Subscription.findById(transaction.subscription).populate('plan');
    if (existingSub) {
      return { success: true, status: 'paid', subscription: existingSub };
    }
  }

  paymentLog('SYNC_WITH_SABPAISA_STARTED', { merchantTxnId: transaction.merchantTxnId, paymentId: transaction.paymentId });
  try {
    const response = await sabpaisaClient.get(`/api/v2/payments/${transaction.paymentId}/status`);
    const data = response.data || {};
    paymentLog('SYNC_WITH_SABPAISA_RESPONSE', { merchantTxnId: transaction.merchantTxnId, paymentId: transaction.paymentId, status: data.status });

    const normalizedStatus = String(data.status || '').toUpperCase().replace(/[.\- ]/g, '_');
    if (successfulStatuses.has(normalizedStatus) || normalizedStatus.endsWith('_SUCCESS') || normalizedStatus.endsWith('_SUCCEEDED')) {
      const subscription = await activateSubscription(transaction, data);
      triggerMetaPurchase(transaction).catch((err) =>
        paymentLog('META_CAPI_DISPATCH_ERROR', { merchantTxnId: transaction.merchantTxnId, message: err.message })
      );
      return { success: true, status: 'paid', subscription };
    }

    if (failedStatuses.has(normalizedStatus) || normalizedStatus.endsWith('_FAILED')) {
      transaction.status = 'failed';
      transaction.gatewayPayload = data;
      await transaction.save();
      return { success: false, status: 'failed', gatewayData: data };
    }

    // Still pending / processing
    return { success: false, status: 'pending', gatewayData: data };
  } catch (err) {
    paymentLog('SYNC_WITH_SABPAISA_ERROR', { merchantTxnId: transaction.merchantTxnId, paymentId: transaction.paymentId, error: err.response?.data || err.message });
    return { success: false, error: err.response?.data || err.message };
  }
};

// Atomic claim prevents duplicate Purchase events on webhook retries or
// concurrent redelivery — only one caller can flip metaPurchaseSent false -> true.
const triggerMetaPurchase = async (transaction) => {
  const claimed = await PaymentTransaction.findOneAndUpdate(
    { _id: transaction._id, metaPurchaseSent: false },
    { $set: { metaPurchaseSent: true } },
    { new: true }
  );
  if (!claimed) {
    paymentLog('META_CAPI_ALREADY_SENT', { merchantTxnId: transaction.merchantTxnId });
    return;
  }

  const populated = await PaymentTransaction.findById(claimed._id).populate('user').populate('plan');
  const result = await sendMetaEvent({
    eventName: 'Purchase',
    eventId: populated.merchantTxnId,
    eventSourceUrl: `${(process.env.FRONTEND_URL || '').split(',')[0]}/payment-result`,
    actionSource: 'website',
    userData: {
      email: populated.user?.email,
      phone: populated.user?.phone,
      clientIpAddress: populated.clientIpAddress,
      clientUserAgent: populated.clientUserAgent,
      fbp: populated.fbp,
      fbc: populated.fbc,
    },
    customData: {
      currency: populated.currency,
      value: populated.amount,
      contentType: 'product',
      contents: [{ id: String(populated.plan?._id), quantity: 1, item_price: populated.amount }],
    },
  });

  if (result === null) {
    // sendMetaEvent returns null both for missing config AND for network/API
    // failures (see its catch block) — so this revert can't distinguish
    // "never sent" from "sent but response handling failed." Reverting favors
    // retry-ability over the (rare) risk of a duplicate Purchase on Meta's side.
    await PaymentTransaction.updateOne({ _id: claimed._id }, { $set: { metaPurchaseSent: false } });
    paymentLog('META_CAPI_REVERTED', { merchantTxnId: populated.merchantTxnId });
  } else {
    paymentLog('META_CAPI_SENT', { merchantTxnId: populated.merchantTxnId });
  }
};

const createOrder = async (req, res) => {
  try {
    const { planId, promoCode, source = 'web', fbp, fbc } = req.body;
    const clientIpAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const clientUserAgent = req.headers['user-agent'] || null;
    const allowedSources = ['web', 'android', 'ios', 'api'];
    const normalizedSource = allowedSources.includes(source) ? source : 'web';
    paymentLog('CREATE_REQUEST_RECEIVED', { userId: req.user.id, planId, hasPromoCode: Boolean(promoCode), source: normalizedSource });
    if (!planId) return res.status(400).json({ success: false, message: 'planId required' });

    const [plan, user] = await Promise.all([Plan.findById(planId), User.findById(req.user.id)]);
    if (!plan || !plan.isActive) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let finalAmount = plan.price;
    let appliedPromo = null;
    if (promoCode) {
      const promo = await Promo.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (!promo || (promo.expiryDate && promo.expiryDate < new Date()) || promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
      }
      if (promo.applicablePlans?.length && !promo.applicablePlans.some((id) => id.toString() === planId)) {
        return res.status(400).json({ success: false, message: 'Promo not valid for this plan' });
      }
      const discount = promo.discountType === 'percentage' ? (plan.price * promo.discountValue) / 100 : promo.discountValue;
      finalAmount = Math.max(plan.price - discount, 0);
      appliedPromo = promo.code;
    }

    const merchantTxnId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amountPaise = Math.round(finalAmount * 100);
    const timestamp = Math.floor(Date.now() / 1000);
    const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');
    if (!backendUrl) throw new Error('Set BACKEND_URL in environment');

    const payload = {
      merchantId: SABPAISA_MERCHANT_ID,
      merchantTxnId,
      amount: amountPaise,
      currency: 'INR',
      timestamp,
      checksum: generateChecksum(merchantTxnId, amountPaise, 'INR', timestamp),
      customerName: user.name || 'User',
      customerEmail: user.email || 'noreply@mirchiott.com',
      customerPhone: user.phone || '9999999999',
      returnUrl: `${backendUrl}/api/payment/return`,
      webhookUrl: process.env.SABPAISA_WEBHOOK_URL || `${backendUrl}/api/payment/webhook`,
      notes: { planId, userId: req.user.id, promoCode: appliedPromo || '' },
    };
    paymentLog('SABPAISA_CREATE_REQUEST', { merchantTxnId, planId, amount: finalAmount, amountPaise, returnUrl: payload.returnUrl, webhookUrl: payload.webhookUrl });
    const { data } = await sabpaisaClient.post('/api/v2/payments', payload);
    paymentLog('SABPAISA_CREATE_RESPONSE', { merchantTxnId, paymentId: data?.paymentId, status: data?.status, success: data?.success, hasCheckoutUrl: Boolean(data?.checkoutUrl) });
    if (!data?.checkoutUrl || !data?.paymentId) throw new Error('SabPaisa did not return checkoutUrl or paymentId');

    await PaymentTransaction.create({
      merchantTxnId,
      paymentId: data.paymentId,
      user: req.user.id,
      plan: plan._id,
      source: normalizedSource,
      promoCode: appliedPromo,
      amount: finalAmount,
      currency: 'INR',
      clientIpAddress,
      clientUserAgent,
      fbp: fbp || null,
      fbc: fbc || null,
    });
    paymentLog('TRANSACTION_SAVED', { merchantTxnId, paymentId: data.paymentId, userId: req.user.id, planId, amount: finalAmount, source: normalizedSource });
    const checkoutUrl = data.clientSecret ? `${data.checkoutUrl}?clientSecret=${encodeURIComponent(data.clientSecret)}` : data.checkoutUrl;
    return res.status(200).json({ success: true, checkoutUrl, paymentId: data.paymentId, merchantTxnId, amount: finalAmount, source: normalizedSource });
  } catch (err) {
    paymentLog('CREATE_FAILED', { message: err.message, gatewayError: err.response?.data });
    console.error('Create Order Error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: err.message, error: err.response?.data });
  }
};

// Verifies payment status and activates subscription by querying SabPaisa API if still pending
const verifyPayment = async (req, res) => {
  try {
    const merchantTxnId = req.body.merchantTxnId || req.body.txnId;
    const paymentId = req.body.paymentId;
    paymentLog('VERIFY_REQUEST_RECEIVED', { merchantTxnId, paymentId, userId: req.user.id });
    if (!merchantTxnId && !paymentId) return res.status(400).json({ success: false, message: 'merchantTxnId or paymentId required' });

    const query = { user: req.user.id };
    if (merchantTxnId) query.merchantTxnId = merchantTxnId;
    else query.paymentId = paymentId;

    const transaction = await PaymentTransaction.findOne(query).populate('subscription');
    if (!transaction) {
      paymentLog('VERIFY_NOT_FOUND', { merchantTxnId, paymentId, userId: req.user.id });
      return res.status(404).json({ success: false, message: 'Payment transaction not found' });
    }

    // If already marked as paid
    if (transaction.status === 'paid' && transaction.subscription) {
      paymentLog('VERIFY_SUCCESS_ALREADY_PAID', { merchantTxnId: transaction.merchantTxnId, subscriptionId: transaction.subscription?._id?.toString() || transaction.subscription?.toString() });
      return res.json({ success: true, message: 'Payment verified', subscription: transaction.subscription, source: transaction.source });
    }

    // Query SabPaisa API directly to get live status and activate if succeeded
    const syncResult = await syncTransactionWithSabPaisa(transaction);
    if (syncResult.success && syncResult.status === 'paid') {
      paymentLog('VERIFY_SUCCESS_SYNCED', { merchantTxnId: transaction.merchantTxnId, subscriptionId: syncResult.subscription?._id?.toString() });
      return res.json({ success: true, message: 'Payment verified and subscription activated', subscription: syncResult.subscription, source: transaction.source });
    }

    if (syncResult.status === 'failed') {
      paymentLog('VERIFY_FAILED_STATUS', { merchantTxnId: transaction.merchantTxnId });
      return res.status(400).json({ success: false, message: 'Payment failed on gateway', status: 'failed' });
    }

    paymentLog('VERIFY_PENDING', { merchantTxnId: transaction.merchantTxnId, transactionStatus: transaction.status });
    return res.status(202).json({ success: false, message: 'Payment is awaiting SabPaisa confirmation', status: 'pending' });
  } catch (err) {
    paymentLog('VERIFY_FAILED', { message: err.message });
    console.error('Verify Payment Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const sabPaisaWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers['x-sabpaisa-signature'];
    paymentLog('WEBHOOK_RECEIVED', { hasSignature: Boolean(signatureHeader), contentLength: req.headers['content-length'], body: req.body });

    const merchantTxnId = getValue(req.body, 'merchantTxnId', 'merchant_txn_id', 'merchantTransactionId');
    const paymentId = getValue(req.body, 'paymentId', 'payment_id');
    const status = getValue(req.body, 'status', 'payment_status', 'event');

    if (!merchantTxnId && !paymentId) {
      paymentLog('WEBHOOK_REJECTED', { reason: 'Missing transaction identifier' });
      return res.status(400).send('Missing transaction identifier');
    }

    const transaction = await PaymentTransaction.findOne({
      $or: [
        ...(merchantTxnId ? [{ merchantTxnId }] : []),
        ...(paymentId ? [{ paymentId }] : []),
      ],
    });

    if (!transaction) {
      paymentLog('WEBHOOK_REJECTED', { merchantTxnId, paymentId, reason: 'Unknown payment transaction' });
      return res.status(404).send('Unknown payment transaction');
    }

    // Check signature if header is provided and secret is configured
    let signatureValid = false;
    if (signatureHeader && process.env.SABPAISA_WEBHOOK_SECRET) {
      const [timestamp, receivedSignature] = signatureHeader.split('.');
      if (timestamp && receivedSignature && Math.abs(Date.now() - Number(timestamp)) <= 300000) {
        const expectedSignature = crypto.createHmac('sha256', process.env.SABPAISA_WEBHOOK_SECRET)
          .update(`${timestamp}.`).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest('base64');
        const expected = Buffer.from(expectedSignature);
        const received = Buffer.from(receivedSignature);
        if (expected.length === received.length && crypto.timingSafeEqual(expected, received)) {
          signatureValid = true;
        }
      }
    }

    const normalizedStatus = String(status || '').toUpperCase().replace(/[.\- ]/g, '_');
    const isReportedSuccess = successfulStatuses.has(normalizedStatus) || normalizedStatus.endsWith('_SUCCESS') || normalizedStatus.endsWith('_SUCCEEDED');

    if (signatureValid && isReportedSuccess) {
      const subscription = await activateSubscription(transaction, req.body);
      triggerMetaPurchase(transaction).catch((err) =>
        paymentLog('META_CAPI_DISPATCH_ERROR', { merchantTxnId: transaction.merchantTxnId, message: err.message })
      );
      return res.status(200).json({ status: 'processed', subscriptionId: subscription._id });
    }

    // Resilient fallback: Always verify directly with SabPaisa's server-to-server API
    paymentLog('WEBHOOK_FALLBACK_QUERYING_SABPAISA', { merchantTxnId: transaction.merchantTxnId, paymentId: transaction.paymentId });
    const syncResult = await syncTransactionWithSabPaisa(transaction);
    if (syncResult.success && syncResult.status === 'paid') {
      return res.status(200).json({ status: 'processed', subscriptionId: syncResult.subscription._id });
    }

    if (failedStatuses.has(normalizedStatus) || normalizedStatus.endsWith('_FAILED')) {
      transaction.status = 'failed';
    }
    transaction.gatewayPayload = req.body;
    await transaction.save();
    paymentLog('WEBHOOK_NON_FINAL_EVENT_SAVED', { merchantTxnId: transaction.merchantTxnId, gatewayStatus: status, transactionStatus: transaction.status });
    return res.status(200).json({ status: 'received' });
  } catch (error) {
    paymentLog('WEBHOOK_FAILED', { message: error.message });
    console.error('Webhook Error:', error.message);
    return res.status(500).send('Webhook error');
  }
};

const sabPaisaReturn = async (req, res) => {
  try {
    const merchantTxnId = getValue(req.query, 'merchantTxnId', 'merchant_txn_id', 'txnId') ||
                          getValue(req.body, 'merchantTxnId', 'merchant_txn_id', 'txnId') || '';
    const paymentId = getValue(req.query, 'paymentId', 'payment_id') ||
                      getValue(req.body, 'paymentId', 'payment_id') || '';
    const rawStatus = getValue(req.query, 'status', 'payment_status') ||
                      getValue(req.body, 'status', 'payment_status') || '';

    paymentLog('RETURN_URL_RECEIVED', { merchantTxnId, paymentId, rawStatus, query: req.query, body: req.body });

    let transaction = null;
    if (merchantTxnId) {
      transaction = await PaymentTransaction.findOne({ merchantTxnId });
    }
    if (!transaction && paymentId) {
      transaction = await PaymentTransaction.findOne({ paymentId });
    }

    let finalStatus = rawStatus || 'pending';

    if (transaction) {
      if (transaction.status === 'paid') {
        finalStatus = 'success';
      } else {
        const syncResult = await syncTransactionWithSabPaisa(transaction);
        if (syncResult.success && syncResult.status === 'paid') {
          finalStatus = 'success';
        } else if (syncResult.status === 'failed') {
          finalStatus = 'failed';
        }
      }
    }

    // Determine target frontend URL for redirect
    const targetUrl = process.env.SABPAISA_FINAL_REDIRECT_URL || process.env.SABPAISA_RETURN_URL || process.env.FRONTEND_URL || 'https://bichoo.app/goPremium';
    const baseUrl = targetUrl.split(',')[0].trim();
    const delimiter = baseUrl.includes('?') ? '&' : '?';
    const txnParam = transaction?.merchantTxnId || merchantTxnId;

    return res.redirect(`${baseUrl}${delimiter}txnId=${encodeURIComponent(txnParam)}&status=${encodeURIComponent(finalStatus)}`);
  } catch (err) {
    paymentLog('RETURN_URL_ERROR', { message: err.message });
    const targetUrl = (process.env.SABPAISA_FINAL_REDIRECT_URL || process.env.SABPAISA_RETURN_URL || 'https://bichoo.app/goPremium').split(',')[0].trim();
    return res.redirect(`${targetUrl}?status=error`);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  sabPaisaWebhook,
  sabPaisaReturn,
  syncTransactionWithSabPaisa,
};