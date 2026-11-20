const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const appPaths = window.AmanStepPaths;
const staticRuntime = document.querySelector('meta[name="amanstep-runtime"]')?.content === 'static';
const relayBase = (() => {
  const value = document.querySelector('meta[name="amanstep-relay-url"]')?.content?.trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const loopback = ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname);
    if (
      (parsed.protocol !== 'https:' && !(loopback && parsed.protocol === 'http:'))
      || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password
    ) return '';
    return parsed.origin;
  } catch (_error) { return ''; }
})();
let trustedCredentialStore = null;
try { trustedCredentialStore = window.AmanStepTrustedStore.createStore(); } catch (_error) { /* fail closed */ }

const copy = {
  en: {
    brandSubtitle: 'Scam emergency & recovery', privateByDesign: 'Private by design', settingsLabel: 'Settings', privateAILabel: 'Private AI:', privateAIChecking: 'checking this phone', privateAIOff: 'checks run on this phone with rules and official UAE lists', privateAIReady: 'ready on this device', privateAIDownloading: 'preparing privately on Wi-Fi', privateAIWaitingWifi: 'waiting for confirmed Wi-Fi', privateAINotSupported: 'not supported on this phone', privateAIUnavailable: 'unavailable; safety plan unchanged', skipToContent: 'Skip to content', eyebrow: 'UAE incident support',
    heroTitle: 'What is happening right now?', heroBody: 'Choose the closest situation. AmanStep will show one safe action first, then stay with the case.',
    safetyBoundaries: 'Safety boundaries', neverOpens: 'Never opens suspicious links', neverReports: 'Never reports without you', officialSources: 'Cites reviewed official sources',
    responseLoop: 'AmanStep response loop', userControlled: 'You stay in control', loopStop: 'Stop the pressure', loopStopBody: 'Remove the scammer’s immediate influence', loopVerify: 'Verify independently', loopVerifyBody: 'Use a reviewed route, never the message', loopRecover: 'Keep recovery moving', loopRecoverBody: 'Track actions, evidence and follow-up', oneDecision: 'One clear decision at a time',
    startHere: 'Start here', chooseSituation: 'Choose the closest situation', noDiagnosis: 'No diagnosis. No automatic report. Just the next safe action.', livePressure: 'Live pressure', checkFirst: 'Check first', protectAccess: 'Protect access', recoverFunds: 'Start recovery',
    checkingTitle: 'Check a message or link', checkingBody: 'A message, link, job offer, or request feels unusual',
    callTitle: 'Someone is pressuring me now', callBody: 'A caller wants a code, payment, app install, or UAE Pass approval',
    emergencySentence: 'Say: “I’m ending this call. I will contact the organisation myself.”', emergencyHang: 'Hang up & verify', emergencyBank: 'Call my bank (card number route)', emergencyTrusted: 'Tell my trusted contact',
    sharedTitle: 'I shared a code or my details', sharedBody: 'A password, OTP, card detail, screen access, or unknown app',
    moneyTitle: 'I sent money', moneyBody: 'A bank transfer, card payment, fee, or crypto transfer',
    notEmergencyTitle: 'Immediate physical danger?', notEmergencyBody: 'Use the UAE emergency number 999. AmanStep is decision support, not an emergency service.',
    startOver: '← Start over', privateCase: 'Private, temporary case', caseTitle: 'Your safety plan', caseProgressLabel: 'Case progress', progressPause: 'Pause pressure', progressProtect: 'Protect access', progressRecover: 'Recover', progressFollow: 'Follow up',
    checkHeading: 'Check the suspicious content', checkPrivacy: 'Paste or share text. Links are parsed as text only and are never visited.',
    messageLabel: 'Message or link', messagePlaceholder: 'Paste the full suspicious message', analyseButton: 'Analyse without opening',
    planHeading: 'Your ordered plan', planBody: 'Mark a step only after you actually complete it.',
    directoryHeading: 'Verify through a route independent of the message', directoryBody: 'These routes were manually reviewed. Choose the organisation that actually applies to your case.',
    changedHeading: 'Did the situation change?', changedBody: 'Tell AmanStep so the next action can change too.',
    evidenceHeading: 'Prepare a factual evidence draft', evidenceBody: 'Do not enter passwords or security codes. Nothing is submitted automatically.',
    amountLabel: 'Amount and currency', referenceLabel: 'Transaction reference', summaryLabel: 'Brief factual summary', downloadDraft: 'Create review draft',
    followupHeading: 'Keep recovery moving', followupBody: 'Choose only the reminders you want on this device.', enableFollowups: 'Enable local reminders', disableFollowups: 'Turn off and clear reminders', followupLimit: 'System alerts work while the app is active. If the browser closes, overdue reminders appear the next time AmanStep opens. Reliable closed-app delivery still requires Web Push.', followupsEnabled: 'Local follow-ups are enabled. Nothing was sent to an external service.', followupsInAppOnly: 'System notifications are unavailable. Overdue reminders will still appear when AmanStep is open.', followupsDisabled: 'Local reminders are off and pending reminders were cleared.', followupScheduled: 'Reminder scheduled on this device.', followupCancelled: 'Reminder removed from this device.', scheduleFollowup: 'Schedule', cancelFollowup: 'Remove', dismissFollowup: 'Dismiss', reminderDue: 'Due now', reminderScheduledFor: 'Scheduled for', reminderInOneHour: 'in 1 hour', reminderInSixHours: 'in 6 hours', reminderInOneDay: 'in 24 hours', reminderBankReference: 'Did the bank give you a reference number?', reminderEcrime: 'Have you filed the eCrime report?', reminderStatement: 'Check your statement for new transactions.',
    casePrivacyTitle: 'What AmanStep stores for this prototype', casePrivacyBody: 'Structured case tasks stay on this device for up to four hours; the raw message is never added. Optional follow-ups store only a closed reminder kind, task id and time until dismissed or turned off. A configured family relay receives only pairing tokens, a short contact alias, consent scopes, a closed alert type and an opaque case reference. Nothing is reported or sent automatically.',
    aboutLink: 'About · عن التطبيق', privacyLink: 'Privacy · الخصوصية', termsLink: 'Terms · الشروط', contactLink: 'Contact · تواصل',
    footer: 'Independent decision support. Not affiliated with Dubai Police, TDRA, CBUAE, or any bank.',
    nextNow: 'Do this now', done: 'I did this', endedCall: 'I ended the call', completed: 'Completed', stepsDone: 'steps completed',
    whyFirst: 'Why this action is first', techDetails: 'Technical details (for reviewers)', noExternalAction: 'AmanStep has not contacted anyone or performed this action for you.',
    agentPolicyTitle: 'Policy-checked agent decision', agentObserved: 'Observed stage', agentSelected: 'Allowed tool', agentConfirmation: 'User confirmation', agentConfirmationRequired: 'required before action', agentReady: 'not needed to show this step', agentBlocked: 'The requested action was blocked by policy.',
    traceSignals: 'Signals seen', tracePolicy: 'Policy rule', traceSource: 'Official source', traceModel: 'Model contribution', traceStage: 'Case stage', traceIncident: 'Incident type', traceNoRuleSignals: 'No message rule was needed for this manual path.', traceNoSource: 'No case-specific official advisory was used for this action.', traceModelNone: 'No model fact contributed. Deterministic policy selected this action.', traceModelAdded: 'On-device model signals were added; deterministic policy still selected the action.', traceModelRaised: 'On-device model signals raised the risk or stage; they did not remove a rule hit.', tracePublished: 'Published', tracePolicyVersion: 'Policy version', traceSelection: 'Selection',
    incidentTypes: { unknown: 'Not yet classified', bank_transfer: 'Bank transfer', card_payment: 'Card payment', crypto_transfer: 'Crypto transfer', gift_card: 'Gift card', credentials_or_otp: 'Credentials or code exposed', apk_installed: 'App or remote access' },
    traceFactNames: { payment_method: 'Payment method', timing_bucket: 'Timing', amount_range: 'Amount range', exposure_type: 'Additional exposure' },
    decisionReasons: {
      suspected: 'No loss is confirmed, so interaction pauses before independent verification.',
      active: 'Pressure is happening now, so ending contact removes the caller’s immediate influence.',
      compromised: 'Access may be exposed, so containment starts before reporting.',
      paid: 'Money has moved, so the sending institution comes first while response options may still exist.',
      reported: 'A report is confirmed, so evidence and follow-up remain next.',
      monitoring: 'Immediate containment is complete, so the plan tracks references and follow-up.',
      closed: 'The case was deliberately closed by the user.',
    },
    creating: 'Preparing the safest next action…', failed: 'AmanStep could not create the plan. Please try again.',
    offlineMode: 'Offline mode: emergency actions, local rules and your recovery checklist remain available.', trustedNeedsConnection: 'Trusted Contact needs a connection and a configured family relay. Your safety plan still works offline.', staticRelayUnavailable: 'This public build has no family relay configured. The safety plan still stays on your device.',
    resumeTitle: 'Continue your safety plan', resumeBody: 'A structured plan is saved on this device for up to four hours. The suspicious message is not saved.', resumeAction: 'Continue plan',
    checking: 'Checking local policy and reviewed official warnings…', analysisFailed: 'The analysis could not be completed. No message data was saved.', lastVerifiedGuidance: 'Live guidance could not be verified. Using last verified guidance from {date}.', guidanceUnavailable: 'No verified advisory bundle is cached yet. Local safety rules still work; verify through an official channel you find yourself.',
    observed: 'What was observed', related: 'Related official warning', doNext: 'Do this next', noRule: 'No high-confidence rule was triggered.', noSource: 'No reviewed official warning was confidently matched.',
    feedTitle: 'AmanStep is working on this', feedRead: 'Read the message without opening its links', feedMatched: 'Matched a reviewed warning', feedNoMatch: 'Checked reviewed warnings; no confident match', feedPlanned: 'Built your next safety step', feedNext: 'Your next safe action', feedTrustedReady: 'Trusted contact is ready', feedTrustedSetup: 'Trusted contact needs setup', feedWhy: 'Why?', feedOpenSource: 'Open source', feedContinue: 'Continue', feedTellContact: 'Tell my trusted contact', feedSetUpContact: 'Set up trusted contact', feedReadWhy: 'The text was processed in this browser. No link was opened.', feedNoMatchWhy: 'The local checks found no confident advisory match. This does not mean the message is safe.', feedPlanWhy: 'A closed safety policy selected this step. No external action was performed.', feedNextWhy: 'This is the first pending step in your current safety plan.', feedTrustedReadyWhy: 'The pairing is active and already includes consent for this alert type.', feedTrustedSetupWhy: 'No active pairing with the required consent scope is available.', feedRoute: 'Check on the official site', feedRouteOpen: 'Open the official page', feedRouteAlso: 'Or check', feedRouteLook: 'What to look for', trustWarnSite: 'Official warning: the CMA warned about {x}', trustWarnHandle: 'Official warning: the CMA warned about the account {x}', trustWarnName: 'Official warning: "{x}" is on the CMA warnings list', trustLicensed: '{x} is on the Central Bank register', trustLicensedWhy: 'Licensed does not mean this message is from them. Contact them only through their official app or the number on your card.', trustNone: 'Checked UAE official registers: no entry found', trustNoneWhy: 'Checked {cma} CMA warnings and {cb} Central Bank licences on this phone. Not being listed does not make a message safe.', trustWarnWhy: 'Published by the CMA on {date}. AmanStep repeats what the regulator published; it does not judge the firm itself. Checked on this phone; nothing was sent.', trustDateUnknown: 'an unstated date', trustReason: 'An official UAE regulator warning names this website, account or firm.', trustSummary: 'An official UAE warning matches this message. Do not pay or share anything.', trustOpenSource: 'Open the official list', feedRouteWhy: 'AmanStep chose this authority from the warning signs. It opens their public page only after you tap; nothing is copied or sent.',
    feedModelApproval: 'Private AI noticed a possible fake app-approval request', feedModelRemote: 'Private AI noticed a request to install or share access', feedModelSecret: 'Private AI noticed a request for a code or secret', feedModelPayment: 'Private AI noticed a payment request', feedModelPressure: 'Private AI noticed pressure or urgency', feedModelWhy: 'This sentence came from bounded on-device extraction. Tested rules still control the safety result.', modelSuggested: 'Private AI suggestion — confirm before saving',
    safetyMergeTitle: 'Asymmetric safety merge', safetyMergeRaised: 'On-device facts raised the safety level; no rule result or reason was removed.', modelFactEvidence: 'Closed on-device fact',
    modelReasonLabels: { MODEL_PRESSURE: 'Pressure or urgency detected', MODEL_SECRET_REQUEST: 'A code or secret is requested', MODEL_APP_APPROVAL: 'An in-app approval is requested', MODEL_INSTALL_REQUEST: 'An install or access grant is requested', MODEL_PAYMENT_REQUEST: 'A payment is requested' },
    sourceReviewed: 'Source reviewed', markDone: 'Mark completed', draftReady: 'Bank and eCrime review drafts are ready below. Nothing was sent.', downloadNow: 'Download full JSON', fullEvidencePack: 'View full evidence JSON', copyDraft: 'Copy full JSON', copiedDraft: 'Draft copied. It was not sent anywhere.', bankDraftHeading: 'Bank fraud-dispute draft', ecrimeDraftHeading: 'eCrime-ready incident summary', copyBankDraft: 'Copy bank draft', copyEcrimeDraft: 'Copy eCrime summary',
    officialChannel: 'Official channel', priorities: { immediate: 'Immediate', high: 'High', normal: 'Normal' },
    openOfficial: 'Open official route', callOfficial: 'Call', reviewedOn: 'Reviewed',
    moreRoutes: 'More reviewed UAE routes', moneyDialogTitle: 'How did the money move?', moneyDialogBody: 'This changes the first recovery action.', bankTransferChoice: 'Bank transfer', cardChoice: 'Card payment or card charged', cryptoChoice: 'Crypto transfer', giftCardChoice: 'Gift card or voucher code',
    exposureDialogTitle: 'What was exposed?', exposureDialogBody: 'Choose the closest option so containment starts correctly.', credentialsChoice: 'Password, OTP, or card detail', approvalChoice: 'I approved a bank-app or UAE Pass request', remoteChoice: 'Screen share or remote access', appChoice: 'Unknown app or APK',
    intakeHeading: 'A few recovery details', intakeBody: 'One question at a time. The urgent action above never waits for these details.', intakeComplete: 'The needed recovery details are captured on this device.', intakeProgressText: '{done}/{total} details', intakeInvalid: 'Enter the institution name only. Never enter an OTP, password, PIN, CVV, account number, or recovery phrase.',
    intakePaymentMethod: 'How did the money move?', intakeTiming: 'When did this happen?', intakeInstitution: 'Which bank, issuer, exchange, or store was involved?', intakeAmount: 'About how much was involved? (optional)', intakeExposure: 'What else may have been shared or approved?', institutionPlaceholder: 'Institution name only—never enter an account number', saveAnswer: 'Save answer', skipChoice: 'Skip', notSureChoice: 'Not sure',
    timing15m: 'Within the last 15 minutes', timingHour: 'Within the last hour', timingToday: 'Earlier today', timingEarlier: 'Before today', amountUnder500: 'Under AED 500', amount500to5000: 'AED 500–5,000', amountOver5000: 'Over AED 5,000', exposureNone: 'Nothing else that I know of', exposureOtp: 'OTP or verification code', exposureApproval: 'Bank-app or UAE Pass approval', exposureCredentials: 'Card details or password', exposureRemote: 'Screen share or remote access', exposureApp: 'Unknown app or APK',
    trustedHeading: 'Trusted contact', trustedBody: 'This is not monitoring. Your contact cannot read your messages or location. They receive only a status alert you explicitly send.', createPairing: 'Create a private pairing code', pairingConsent: 'I chose this person freely. No one is pressuring me to add them.', contactConsent: 'I freely choose to accept. This does not let anyone monitor a phone, messages, or location.', coercionStop: 'If someone is forcing you to pair, stop here. You can remove either device without the other person’s permission.', pairingCode: 'Pairing code', openContactInbox: 'Open contact inbox', contactMustClaim: 'Ask your contact to accept this code. Then confirm them here.', confirmContact: 'Confirm accepted contact', sendTrustedAlert: 'Send a sanitised status alert', removeThisDevice: 'Remove this device and revoke access', pairingNoRecovery: 'Pairing credentials stay only on this device. If browser storage is cleared, the pairing cannot be recovered; create a new one and tell the old contact.', trustedStorageUnavailable: 'Secure device storage is unavailable. No pairing was created.', deviceRemoved: 'This device was removed and its pairing access was revoked.', pairingWaiting: 'The contact has not accepted the code yet.', pairingActive: 'Pairing active. It is not monitoring; every alert still requires your explicit click.', alertQueued: 'Alert placed in the AmanStep demo inbox. No SMS, WhatsApp, or external service was used.',
    backAmanStep: '← Back to AmanStep', demoInbox: 'Trusted contact demo inbox', claimTitle: 'Accept a trusted-contact invitation', claimBody: 'Enter the code your family member gave you. Claiming does not activate alerts until they confirm you again.', inviteLabel: '8-character invite code', aliasLabel: 'How they identify you', acceptInvite: 'Accept invitation', inboxHeading: 'Your private inbox', refreshInbox: 'Refresh', inviteAccepted: 'Invitation accepted. Ask your family member to confirm the pairing.', noAlerts: 'No alerts yet.', claimFailed: 'The code is invalid, expired, or already used.',
    sharedEvent: 'I shared a code or password', installedEvent: 'I installed or allowed remote access', paidEvent: 'I sent money', reportedEvent: 'I submitted an official report', closeEvent: 'Close this case',
    stages: { suspected: 'Checking', active: 'Active pressure', compromised: 'Access exposed', paid: 'Money sent', reported: 'Reported', monitoring: 'Monitoring', closed: 'Closed' },
    risk: { high_concern: 'High concern', caution: 'Caution', insufficient_evidence: 'Insufficient evidence' },
  },
  ar: {
    brandSubtitle: 'طوارئ الاحتيال والتعافي', privateByDesign: 'الخصوصية أساس التصميم', settingsLabel: 'الإعدادات', privateAILabel: 'الذكاء الخاص:', privateAIChecking: 'جارٍ فحص هذا الهاتف', privateAIOff: 'يتم الفحص على هذا الهاتف بالقواعد والقوائم الرسمية في الإمارات', privateAIReady: 'جاهز على هذا الجهاز', privateAIDownloading: 'جارٍ التحضير بخصوصية عبر Wi-Fi', privateAIWaitingWifi: 'في انتظار Wi-Fi مؤكد', privateAINotSupported: 'غير مدعوم على هذا الهاتف', privateAIUnavailable: 'غير متاح؛ خطة الأمان لم تتغير', skipToContent: 'تخطَّ إلى المحتوى', eyebrow: 'دعم حوادث الاحتيال في الإمارات',
    heroTitle: 'ماذا يحدث الآن؟', heroBody: 'اختر الحالة الأقرب. ستعرض أمان ستيب إجراءً آمناً واحداً أولاً ثم تتابع الحالة معك.',
    safetyBoundaries: 'حدود الأمان', neverOpens: 'لا يفتح الروابط المشبوهة', neverReports: 'لا يبلّغ من دونك', officialSources: 'يستشهد بمصادر رسمية مراجعة',
    responseLoop: 'دورة استجابة أمان ستيب', userControlled: 'أنت صاحب القرار', loopStop: 'أوقف الضغط', loopStopBody: 'أزل تأثير المحتال المباشر', loopVerify: 'تحقق بشكل مستقل', loopVerifyBody: 'استخدم مساراً مراجعاً لا الرسالة', loopRecover: 'واصل التعافي', loopRecoverBody: 'تابع الإجراءات والأدلة والخطوات اللاحقة', oneDecision: 'قرار واضح واحد في كل مرة',
    startHere: 'ابدأ هنا', chooseSituation: 'اختر الحالة الأقرب', noDiagnosis: 'لا تشخيص ولا بلاغ تلقائي؛ فقط الإجراء الآمن التالي.', livePressure: 'ضغط مباشر', checkFirst: 'تحقق أولاً', protectAccess: 'احمِ الوصول', recoverFunds: 'ابدأ التعافي',
    checkingTitle: 'تحقق من رسالة أو رابط', checkingBody: 'رسالة أو رابط أو عرض عمل أو طلب غير معتاد',
    callTitle: 'شخص يضغط علي الآن', callBody: 'المتصل يطلب رمزاً أو دفعة أو تثبيت تطبيق أو موافقة UAE Pass',
    emergencySentence: 'قل: «سأنهي هذه المكالمة وسأتواصل مع الجهة بنفسي.»', emergencyHang: 'أنه المكالمة وتحقق', emergencyBank: 'اتصل ببنكي عبر الرقم على البطاقة', emergencyTrusted: 'أخبر جهة اتصالي الموثوقة',
    sharedTitle: 'شاركت رمزاً أو بياناتي', sharedBody: 'كلمة مرور أو OTP أو بيانات بطاقة أو وصول للشاشة أو تطبيق مجهول',
    moneyTitle: 'أرسلت مالاً', moneyBody: 'تحويل مصرفي أو دفعة بطاقة أو رسوم أو عملات مشفرة',
    notEmergencyTitle: 'هل يوجد خطر جسدي فوري؟', notEmergencyBody: 'استخدم رقم الطوارئ 999 في الإمارات. أمان ستيب أداة دعم قرار وليست خدمة طوارئ.',
    startOver: '→ ابدأ من جديد', privateCase: 'حالة خاصة ومؤقتة', caseTitle: 'خطة الأمان الخاصة بك', caseProgressLabel: 'تقدم الحالة', progressPause: 'أوقف الضغط', progressProtect: 'احمِ الوصول', progressRecover: 'ابدأ التعافي', progressFollow: 'تابع الحالة',
    checkHeading: 'تحقق من المحتوى المشبوه', checkPrivacy: 'الصق النص أو شاركه. تُحلل الروابط كنص فقط ولا تتم زيارتها.',
    messageLabel: 'الرسالة أو الرابط', messagePlaceholder: 'الصق الرسالة المشبوهة كاملة', analyseButton: 'حلّل من دون فتح',
    planHeading: 'خطتك بالترتيب', planBody: 'ضع علامة على الخطوة فقط بعد إكمالها فعلاً.',
    directoryHeading: 'تحقق عبر مسار مستقل عن الرسالة', directoryBody: 'تمت مراجعة هذه المسارات يدوياً. اختر الجهة التي تنطبق فعلاً على حالتك.',
    changedHeading: 'هل تغير الوضع؟', changedBody: 'أخبر أمان ستيب ليتغير الإجراء التالي أيضاً.',
    evidenceHeading: 'جهّز مسودة أدلة واقعية', evidenceBody: 'لا تدخل كلمات المرور أو رموز الأمان. لا يتم إرسال أي شيء تلقائياً.',
    amountLabel: 'المبلغ والعملة', referenceLabel: 'مرجع المعاملة', summaryLabel: 'ملخص واقعي قصير', downloadDraft: 'إنشاء مسودة للمراجعة',
    followupHeading: 'واصل خطوات التعافي', followupBody: 'اختر فقط التذكيرات التي تريدها على هذا الجهاز.', enableFollowups: 'تفعيل التذكيرات المحلية', disableFollowups: 'إيقاف التذكيرات ومسحها', followupLimit: 'تعمل تنبيهات النظام أثناء نشاط التطبيق. إذا أُغلق المتصفح تظهر التذكيرات المتأخرة عند فتح أمان ستيب مجدداً. يتطلب التسليم الموثوق والتطبيق مغلق Web Push.', followupsEnabled: 'تم تفعيل المتابعات المحلية. لم يُرسل شيء إلى خدمة خارجية.', followupsInAppOnly: 'إشعارات النظام غير متاحة. ستظل التذكيرات المتأخرة ظاهرة عند فتح أمان ستيب.', followupsDisabled: 'تم إيقاف التذكيرات المحلية ومسح التذكيرات المعلقة.', followupScheduled: 'تمت جدولة التذكير على هذا الجهاز.', followupCancelled: 'أُزيل التذكير من هذا الجهاز.', scheduleFollowup: 'جدولة', cancelFollowup: 'إزالة', dismissFollowup: 'تجاهل', reminderDue: 'مستحق الآن', reminderScheduledFor: 'مجدول في', reminderInOneHour: 'خلال ساعة', reminderInSixHours: 'خلال 6 ساعات', reminderInOneDay: 'خلال 24 ساعة', reminderBankReference: 'هل أعطاك البنك رقماً مرجعياً؟', reminderEcrime: 'هل قدّمت بلاغ eCrime؟', reminderStatement: 'تحقق من كشف حسابك بحثاً عن معاملات جديدة.',
    casePrivacyTitle: 'ما الذي تخزنه أمان ستيب في هذا النموذج؟', casePrivacyBody: 'تبقى مهام الحالة المنظمة على هذا الجهاز حتى أربع ساعات ولا تُضاف الرسالة الأصلية أبداً. لا تحفظ المتابعات الاختيارية سوى نوع تذكير مغلق ومعرّف مهمة ووقت حتى التجاهل أو الإيقاف. لا يتلقى ترحيل العائلة سوى رموز الربط واسماً مستعاراً قصيراً ونطاقات الموافقة ونوع تنبيه مغلق ومرجع حالة مبهم. لا يتم أي إبلاغ أو إرسال تلقائياً.',
    aboutLink: 'عن التطبيق · About', privacyLink: 'الخصوصية · Privacy', termsLink: 'الشروط · Terms', contactLink: 'تواصل · Contact',
    footer: 'دعم قرار مستقل. غير تابع لشرطة دبي أو TDRA أو المصرف المركزي أو أي بنك.',
    nextNow: 'افعل هذا الآن', done: 'أنجزت هذه الخطوة', endedCall: 'أنهيت المكالمة', completed: 'مكتمل', stepsDone: 'خطوات مكتملة',
    whyFirst: 'لماذا يأتي هذا الإجراء أولاً؟', techDetails: 'تفاصيل تقنية (للمراجعين)', noExternalAction: 'لم تتصل أمان ستيب بأي جهة ولم تنفذ هذا الإجراء نيابةً عنك.',
    agentPolicyTitle: 'قرار الوكيل الخاضع للسياسة', agentObserved: 'المرحلة المرصودة', agentSelected: 'الأداة المسموح بها', agentConfirmation: 'تأكيد المستخدم', agentConfirmationRequired: 'مطلوب قبل الإجراء', agentReady: 'غير مطلوب لعرض هذه الخطوة', agentBlocked: 'تم حظر الإجراء المطلوب وفقاً للسياسة.',
    traceSignals: 'الإشارات المرصودة', tracePolicy: 'قاعدة السياسة', traceSource: 'المصدر الرسمي', traceModel: 'مساهمة النموذج', traceStage: 'مرحلة الحالة', traceIncident: 'نوع الحادثة', traceNoRuleSignals: 'لم يتطلب هذا المسار اليدوي قاعدة لتحليل رسالة.', traceNoSource: 'لم يُستخدم تحذير رسمي خاص بهذه الحالة لهذا الإجراء.', traceModelNone: 'لم تساهم حقيقة من النموذج؛ اختارت السياسة الحتمية هذا الإجراء.', traceModelAdded: 'أضيفت إشارات النموذج على الجهاز، وبقي اختيار الإجراء للسياسة الحتمية.', traceModelRaised: 'رفعت إشارات النموذج على الجهاز مستوى الخطر أو المرحلة ولم تحذف أي إشارة من القواعد.', tracePublished: 'تاريخ النشر', tracePolicyVersion: 'إصدار السياسة', traceSelection: 'طريقة الاختيار',
    incidentTypes: { unknown: 'لم يُصنّف بعد', bank_transfer: 'تحويل مصرفي', card_payment: 'دفعة بطاقة', crypto_transfer: 'تحويل عملات مشفرة', gift_card: 'بطاقة هدايا', credentials_or_otp: 'انكشاف بيانات أو رمز', apk_installed: 'تطبيق أو وصول عن بعد' },
    traceFactNames: { payment_method: 'طريقة الدفع', timing_bucket: 'التوقيت', amount_range: 'نطاق المبلغ', exposure_type: 'انكشاف إضافي' },
    decisionReasons: {
      suspected: 'لم يتم تأكيد خسارة، لذلك يتوقف التفاعل قبل التحقق المستقل.',
      active: 'الضغط يحدث الآن، لذلك ينهي قطع الاتصال التأثير المباشر للمتصل.',
      compromised: 'قد يكون الوصول مكشوفاً، لذلك يبدأ الاحتواء قبل الإبلاغ.',
      paid: 'انتقل المال، لذلك تأتي المؤسسة المرسلة أولاً ما دامت خيارات الاستجابة قد تكون متاحة.',
      reported: 'تم تأكيد البلاغ، لذلك تبقى الأدلة والمتابعة في الخطوة التالية.',
      monitoring: 'اكتمل الاحتواء الفوري، لذلك تتابع الخطة الأرقام المرجعية والمواعيد.',
      closed: 'أغلق المستخدم الحالة عمداً.',
    },
    creating: 'جارٍ إعداد الإجراء الأكثر أماناً…', failed: 'تعذر إنشاء الخطة. حاول مرة أخرى.',
    offlineMode: 'وضع عدم الاتصال: تظل إجراءات الطوارئ والقواعد المحلية وقائمة التعافي متاحة.', trustedNeedsConnection: 'تحتاج جهة الاتصال الموثوقة إلى اتصال وخدمة ترحيل عائلية مهيأة. تظل خطة الأمان متاحة دون اتصال.', staticRelayUnavailable: 'لم تُهيأ خدمة ترحيل عائلية في هذا الإصدار العام. تبقى خطة الأمان على جهازك.',
    resumeTitle: 'تابع خطة الأمان', resumeBody: 'تُحفظ خطة منظمة على هذا الجهاز لمدة تصل إلى أربع ساعات. لا تُحفظ الرسالة المشبوهة.', resumeAction: 'متابعة الخطة',
    checking: 'جارٍ التحقق من السياسات المحلية والتحذيرات الرسمية المراجعة…', analysisFailed: 'تعذر إكمال التحليل. لم تُحفظ بيانات الرسالة.', lastVerifiedGuidance: 'تعذر التحقق من الإرشادات المباشرة. يتم استخدام آخر إرشادات موثقة بتاريخ {date}.', guidanceUnavailable: 'لا توجد حزمة تحذيرات موثقة مخزنة بعد. تظل قواعد الأمان المحلية متاحة؛ تحقق عبر قناة رسمية تجدها بنفسك.',
    observed: 'ما تمت ملاحظته', related: 'التحذير الرسمي المرتبط', doNext: 'افعل التالي', noRule: 'لم يتم تشغيل قاعدة عالية الثقة.', noSource: 'لم تتم مطابقة تحذير رسمي مراجع بثقة.',
    feedTitle: 'أمان ستيب يعمل على حمايتك', feedRead: 'قرأ الرسالة دون فتح روابطها', feedMatched: 'طابق تحذيراً مراجعاً', feedNoMatch: 'فحص التحذيرات؛ لا تطابق واثق', feedPlanned: 'بنى خطوتك الآمنة التالية', feedNext: 'إجراؤك الآمن التالي', feedTrustedReady: 'جهة الاتصال الموثوقة جاهزة', feedTrustedSetup: 'تحتاج جهة الاتصال الموثوقة إلى إعداد', feedWhy: 'لماذا؟', feedOpenSource: 'فتح المصدر', feedContinue: 'متابعة', feedTellContact: 'أخبر جهة اتصالي الموثوقة', feedSetUpContact: 'إعداد جهة اتصال موثوقة', feedReadWhy: 'تمت معالجة النص في هذا المتصفح ولم يُفتح أي رابط.', feedNoMatchWhy: 'لم تجد الفحوص المحلية تطابقاً واثقاً. هذا لا يعني أن الرسالة آمنة.', feedPlanWhy: 'اختارت سياسة أمان مغلقة هذه الخطوة. لم يُنفذ إجراء خارجي.', feedNextWhy: 'هذه أول خطوة معلقة في خطة الأمان الحالية.', feedTrustedReadyWhy: 'الربط نشط ويشمل مسبقاً الموافقة لهذا التنبيه.', feedTrustedSetupWhy: 'لا يوجد ربط نشط بنطاق الموافقة المطلوب.', feedRoute: 'تحقق على الموقع الرسمي', feedRouteOpen: 'افتح الصفحة الرسمية', feedRouteAlso: 'أو تحقق لدى', feedRouteLook: 'ما الذي تبحث عنه', trustWarnSite: 'تحذير رسمي: حذّرت هيئة سوق رأس المال من {x}', trustWarnHandle: 'تحذير رسمي: حذّرت هيئة سوق رأس المال من الحساب {x}', trustWarnName: 'تحذير رسمي: "{x}" مدرج في قائمة تحذيرات هيئة سوق رأس المال', trustLicensed: '{x} مدرج في سجل المصرف المركزي', trustLicensedWhy: 'الترخيص لا يعني أن هذه الرسالة منهم. تواصل معهم فقط عبر تطبيقهم الرسمي أو الرقم المطبوع على بطاقتك.', trustNone: 'تم فحص السجلات الرسمية في الإمارات: لا يوجد إدراج', trustNoneWhy: 'تم فحص {cma} تحذيراً من هيئة سوق رأس المال و{cb} ترخيصاً من المصرف المركزي على هذا الهاتف. عدم الإدراج لا يعني أن الرسالة آمنة.', trustWarnWhy: 'نشرته هيئة سوق رأس المال بتاريخ {date}. ينقل أمان ستيب ما نشرته الجهة الرقابية ولا يحكم على الشركة بنفسه. تم الفحص على هذا الهاتف ولم يُرسل شيء.', trustDateUnknown: 'تاريخ غير مذكور', trustReason: 'تحذير رسمي من جهة رقابية إماراتية يذكر هذا الموقع أو الحساب أو الشركة.', trustSummary: 'تحذير رسمي إماراتي يطابق هذه الرسالة. لا تدفع ولا تشارك أي شيء.', trustOpenSource: 'افتح القائمة الرسمية', feedRouteWhy: 'اختار أمان ستيب هذه الجهة بناءً على علامات التحذير. لا تُفتح صفحتها العامة إلا بعد نقرتك، ولا يُنسخ أو يُرسل أي شيء.',
    feedModelApproval: 'لاحظ الذكاء الخاص طلب موافقة مزيفاً محتملاً', feedModelRemote: 'لاحظ الذكاء الخاص طلباً للتثبيت أو مشاركة الوصول', feedModelSecret: 'لاحظ الذكاء الخاص طلباً لرمز أو سر', feedModelPayment: 'لاحظ الذكاء الخاص طلب دفع', feedModelPressure: 'لاحظ الذكاء الخاص ضغطاً أو استعجالاً', feedModelWhy: 'جاءت هذه الجملة من استخراج محدود على الجهاز. تظل القواعد المختبرة هي التي تحكم نتيجة الأمان.', modelSuggested: 'اقتراح الذكاء الخاص — أكّده قبل الحفظ',
    safetyMergeTitle: 'دمج الأمان غير المتماثل', safetyMergeRaised: 'رفعت الحقائق الموجودة على الجهاز مستوى الأمان، ولم تُحذف أي نتيجة أو إشارة من القواعد.', modelFactEvidence: 'حقيقة مغلقة على الجهاز',
    modelReasonLabels: { MODEL_PRESSURE: 'تم رصد ضغط أو استعجال', MODEL_SECRET_REQUEST: 'يوجد طلب لرمز أو سر', MODEL_APP_APPROVAL: 'يوجد طلب موافقة داخل التطبيق', MODEL_INSTALL_REQUEST: 'يوجد طلب تثبيت أو منح وصول', MODEL_PAYMENT_REQUEST: 'يوجد طلب دفع' },
    sourceReviewed: 'تاريخ مراجعة المصدر', markDone: 'وضع علامة مكتمل', draftReady: 'مسودتا البنك وeCrime جاهزتان للمراجعة أدناه. لم يُرسل شيء.', downloadNow: 'تنزيل JSON الكامل', fullEvidencePack: 'عرض JSON الكامل للأدلة', copyDraft: 'نسخ JSON الكامل', copiedDraft: 'تم نسخ المسودة ولم تُرسل إلى أي جهة.', bankDraftHeading: 'مسودة اعتراض احتيال للبنك', ecrimeDraftHeading: 'ملخص واقعة جاهز لمراجعة eCrime', copyBankDraft: 'نسخ مسودة البنك', copyEcrimeDraft: 'نسخ ملخص eCrime',
    officialChannel: 'القناة الرسمية', priorities: { immediate: 'فوري', high: 'مهم', normal: 'عادي' },
    openOfficial: 'افتح المسار الرسمي', callOfficial: 'اتصل', reviewedOn: 'تمت المراجعة',
    moreRoutes: 'مسارات إماراتية مراجعة أخرى', moneyDialogTitle: 'كيف انتقل المال؟', moneyDialogBody: 'يغيّر هذا أول إجراء للتعافي.', bankTransferChoice: 'تحويل مصرفي', cardChoice: 'دفعة بطاقة أو خصم من البطاقة', cryptoChoice: 'تحويل عملات مشفرة', giftCardChoice: 'بطاقة هدايا أو رمز قسيمة',
    exposureDialogTitle: 'ما الذي انكشف؟', exposureDialogBody: 'اختر الخيار الأقرب ليبدأ الاحتواء بشكل صحيح.', credentialsChoice: 'كلمة مرور أو OTP أو بيانات بطاقة', approvalChoice: 'وافقت على طلب في تطبيق البنك أو UAE Pass', remoteChoice: 'مشاركة شاشة أو وصول عن بعد', appChoice: 'تطبيق مجهول أو APK',
    intakeHeading: 'بعض تفاصيل التعافي', intakeBody: 'سؤال واحد في كل مرة. لا ينتظر الإجراء العاجل أعلاه هذه التفاصيل.', intakeComplete: 'تم حفظ تفاصيل التعافي المطلوبة على هذا الجهاز.', intakeProgressText: '{done}/{total} تفاصيل', intakeInvalid: 'أدخل اسم الجهة فقط. لا تدخل OTP أو كلمة مرور أو PIN أو CVV أو رقم حساب أو عبارة استرداد.',
    intakePaymentMethod: 'كيف انتقل المال؟', intakeTiming: 'متى حدث ذلك؟', intakeInstitution: 'ما البنك أو جهة الإصدار أو المنصة أو المتجر المعني؟', intakeAmount: 'ما المبلغ التقريبي؟ (اختياري)', intakeExposure: 'ما الذي ربما تمت مشاركته أو الموافقة عليه أيضاً؟', institutionPlaceholder: 'اسم الجهة فقط—لا تدخل رقم حساب', saveAnswer: 'حفظ الإجابة', skipChoice: 'تخطي', notSureChoice: 'لست متأكداً',
    timing15m: 'خلال آخر 15 دقيقة', timingHour: 'خلال الساعة الأخيرة', timingToday: 'في وقت سابق اليوم', timingEarlier: 'قبل اليوم', amountUnder500: 'أقل من 500 درهم', amount500to5000: 'من 500 إلى 5,000 درهم', amountOver5000: 'أكثر من 5,000 درهم', exposureNone: 'لا شيء آخر حسب علمي', exposureOtp: 'OTP أو رمز تحقق', exposureApproval: 'موافقة في تطبيق البنك أو UAE Pass', exposureCredentials: 'بيانات بطاقة أو كلمة مرور', exposureRemote: 'مشاركة شاشة أو وصول عن بعد', exposureApp: 'تطبيق مجهول أو APK',
    trustedHeading: 'جهة اتصال موثوقة', trustedBody: 'هذه ليست مراقبة. لا تستطيع جهة الاتصال قراءة رسائلك أو موقعك، ولا تستلم إلا تنبيه حالة ترسله أنت صراحةً.', createPairing: 'إنشاء رمز ربط خاص', pairingConsent: 'اخترت هذا الشخص بحرية ولا يضغط عليّ أحد لإضافته.', contactConsent: 'أختار القبول بحرية. هذا لا يسمح لأحد بمراقبة الهاتف أو الرسائل أو الموقع.', coercionStop: 'إذا أجبرك أحد على الربط فتوقف هنا. يمكن لأي طرف إزالة جهازه دون إذن الطرف الآخر.', pairingCode: 'رمز الربط', openContactInbox: 'فتح صندوق جهة الاتصال', contactMustClaim: 'اطلب من جهة الاتصال قبول الرمز ثم أكدها هنا.', confirmContact: 'تأكيد جهة الاتصال', sendTrustedAlert: 'إرسال تنبيه حالة منقّح', removeThisDevice: 'إزالة هذا الجهاز وإلغاء الوصول', pairingNoRecovery: 'تبقى بيانات الربط على هذا الجهاز فقط. إذا مُسحت بيانات المتصفح فلا يمكن استعادة الربط؛ أنشئ ربطاً جديداً وأخبر جهة الاتصال القديمة.', trustedStorageUnavailable: 'التخزين الآمن على الجهاز غير متاح. لم يتم إنشاء أي ربط.', deviceRemoved: 'أُزيل هذا الجهاز وأُلغي وصول الربط الخاص به.', pairingWaiting: 'لم تقبل جهة الاتصال الرمز بعد.', pairingActive: 'الربط نشط وليس مراقبة. ما زال كل تنبيه يتطلب نقرة صريحة منك.', alertQueued: 'وُضع التنبيه في صندوق أمان ستيب التجريبي. لم تُستخدم خدمة SMS أو WhatsApp أو خدمة خارجية.',
    backAmanStep: '→ العودة إلى أمان ستيب', demoInbox: 'صندوق جهة الاتصال التجريبي', claimTitle: 'قبول دعوة جهة اتصال موثوقة', claimBody: 'أدخل الرمز الذي أعطاك إياه فرد العائلة. لا تتفعل التنبيهات حتى يؤكدك مرة أخرى.', inviteLabel: 'رمز الدعوة من 8 أحرف', aliasLabel: 'كيف يعرّفك', acceptInvite: 'قبول الدعوة', inboxHeading: 'صندوقك الخاص', refreshInbox: 'تحديث', inviteAccepted: 'تم قبول الدعوة. اطلب من فرد العائلة تأكيد الربط.', noAlerts: 'لا توجد تنبيهات بعد.', claimFailed: 'الرمز غير صالح أو منتهي أو مستخدم.',
    sharedEvent: 'شاركت رمزاً أو كلمة مرور', installedEvent: 'ثبّت تطبيقاً أو سمحت بالوصول عن بعد', paidEvent: 'أرسلت مالاً', reportedEvent: 'قدمت بلاغاً رسمياً', closeEvent: 'إغلاق الحالة',
    stages: { suspected: 'قيد التحقق', active: 'ضغط مباشر', compromised: 'انكشاف الوصول', paid: 'تم إرسال المال', reported: 'تم الإبلاغ', monitoring: 'المتابعة', closed: 'مغلق' },
    risk: { high_concern: 'قلق مرتفع', caution: 'تحذير', insufficient_evidence: 'أدلة غير كافية' },
  },
};

let language = 'en';
let currentCase = null;
let pendingSharedText = '';
let directoryEntries = [];
let moneyAction = 'new_case';
let evidenceObjectUrl = '';
let evidencePackText = '';
let bankDraftText = '';
let ecrimeDraftText = '';
let trustedOwner = null;
let trustedContactCredential = null;
let analysisResourcesPromise = null;
let guidanceBundlePromise = null;
let lastVerifiedGuidanceDate = '';
let verifiedGuidanceUnavailable = false;
let coreNetworkUnavailable = false;
let currentReasonCodes = [];
let currentRuleAnalysis = null;
let currentSafetyMerge = null;
const qwenRuntime = window.AmanStepQwen.createRuntime();
const agentRuntime = window.AmanStepAgent.createRuntime();
let qwenStatus = { kind: 'checking', messageKey: 'privateAIChecking' };
let qwenFacts = null;
let privateAIPrefetchPromise = null;
let currentAgentDecision = null;
let intakeRenderVersion = 0;
let followUpStore = null;
let currentActionFeed = null;
let currentTrust = null;
let actionFeedTimers = [];
let actionFeedGeneration = 0;
let emergencyCasePromise = null;
let emergencyCountdownTimer = null;

async function deliverLocalFollowUp(reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return { channel: 'in_app' };
  }
  if (!('serviceWorker' in navigator)) return { channel: 'in_app' };
  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) return { channel: 'in_app' };
    worker.postMessage({
      type: 'SHOW_LOCAL_FOLLOW_UP',
      kind: reminder.kind,
      language: reminder.language,
    });
    return { channel: 'system' };
  } catch (_error) {
    return { channel: 'in_app' };
  }
}

try {
  followUpStore = window.AmanStepFollowUps.createStore({ deliver: deliverLocalFollowUp });
} catch (_error) { /* Recovery actions remain available if local reminders fail. */ }


// "Ask AmanStep" (G2). Kept apart from the main table for review.
Object.assign(copy.en, {
  askHeading: 'Ask AmanStep', askBody: 'Tell AmanStep what happened, in your own words. Nothing is sent until you see the exact text and tap Send.',
  askLabel: 'What happened?', askPlaceholder: 'For example: a caller says he is from my bank and wants the code I just received',
  askPrepare: 'Prepare what will be sent', askPreviewTitle: 'This exact text will be sent', askRemoved: 'Removed on this phone first: {x}',
  askRemovedNone: 'No codes, card numbers, IBANs, Emirates IDs, phone numbers or links were found.',
  askSend: 'Send to AmanStep', askEdit: 'Edit', askThinking: 'AmanStep is thinking. This usually takes about 10 seconds.',
  askUnavailable: 'The AmanStep agent cannot be reached right now. Your safety plan above still works on this phone.',
  askRejected: 'The agent gave an answer outside its safety rules, so it was ignored. Your safety plan above is unchanged.',
  askAgentSays: 'AmanStep says', askOverride: 'The agent’s answer was calmer than this phone’s safety checks, so AmanStep keeps the plan’s next step above.',
  askQuestion: 'One question so AmanStep can choose the right step', askConfirmStage: 'Update my plan: {x}', askAgain: 'Ask something else',
  askStageMoney: 'money was sent', askStageAccess: 'I shared details or access', askStageCall: 'the call is still going on',
  askDidTitle: 'What I did', askDidRedact: 'Removed {x} private detail(s) on this phone before sending', askDidRedactNone: 'Checked for private details on this phone before sending; none found',
  askDidRules: 'Checked the message on this phone: {x}', askDidTrust: 'Checked UAE official lists on this phone: {x}',
  askDidTrustWarn: 'an official warning matches', askDidTrustNone: 'no warning found',
  askDidAgent: 'Asked the AmanStep agent ({model}, {s} s). The text was not stored.',
  askDidChose: 'Chose the first step: {x}', askDidOverride: 'Kept the safety plan’s step because the agent’s answer was calmer than the checks',
  askDidQuestion: 'Asked you one question', askDidStage: 'Waiting for your tap: update the plan ({x})',
  askDidReady: 'Prepared: {x}', askDidNeedsTap: 'Waiting for your tap: {x}', askDidBlocked: 'Blocked by the safety policy: {x}',
  askToolNext: 'show the next step of your plan', askToolRoute: 'open {x}', askToolTrusted: 'alert your trusted contact',
  askNothingDone: 'AmanStep has not contacted anyone or done anything outside this phone.',
  askRemovedKinds: { link: 'link', email: 'email', iban: 'IBAN', emirates_id: 'Emirates ID', card_number: 'card number', phone: 'phone number', number_or_code: 'code or number' },
  askRisk: { insufficient_evidence: 'no strong warning signs', caution: 'caution', high_concern: 'high concern' },
});
Object.assign(copy.ar, {
  askHeading: 'اسأل أمان ستيب', askBody: 'أخبر أمان ستيب بما حدث بكلماتك. لا يُرسل شيء قبل أن ترى النص بالضبط وتضغط إرسال.',
  askLabel: 'ماذا حدث؟', askPlaceholder: 'مثال: متصل يقول إنه من بنكي ويريد الرمز الذي وصلني للتو',
  askPrepare: 'جهّز ما سيُرسل', askPreviewTitle: 'سيُرسل هذا النص بالضبط', askRemoved: 'حُذف أولاً على هذا الهاتف: {x}',
  askRemovedNone: 'لم يُعثر على رموز أو أرقام بطاقات أو IBAN أو هوية إماراتية أو أرقام هواتف أو روابط.',
  askSend: 'أرسل إلى أمان ستيب', askEdit: 'تعديل', askThinking: 'أمان ستيب يفكر. يستغرق ذلك عادة نحو 10 ثوانٍ.',
  askUnavailable: 'لا يمكن الوصول إلى وكيل أمان ستيب الآن. خطة الأمان أعلاه ما زالت تعمل على هذا الهاتف.',
  askRejected: 'أعطى الوكيل إجابة خارج قواعد الأمان فتم تجاهلها. خطة الأمان أعلاه لم تتغير.',
  askAgentSays: 'يقول أمان ستيب', askOverride: 'كانت إجابة الوكيل أهدأ من فحوص الأمان على هذا الهاتف، لذلك يحتفظ أمان ستيب بالخطوة التالية في الخطة أعلاه.',
  askQuestion: 'سؤال واحد ليختار أمان ستيب الخطوة المناسبة', askConfirmStage: 'حدّث خطتي: {x}', askAgain: 'اسأل عن شيء آخر',
  askStageMoney: 'أُرسل المال', askStageAccess: 'شاركت بيانات أو صلاحية وصول', askStageCall: 'المكالمة ما زالت مستمرة',
  askDidTitle: 'ما الذي فعلته', askDidRedact: 'حذفت {x} من التفاصيل الخاصة على هذا الهاتف قبل الإرسال', askDidRedactNone: 'فحصت التفاصيل الخاصة على هذا الهاتف قبل الإرسال؛ لم يوجد شيء',
  askDidRules: 'فحصت الرسالة على هذا الهاتف: {x}', askDidTrust: 'فحصت القوائم الرسمية الإماراتية على هذا الهاتف: {x}',
  askDidTrustWarn: 'يوجد تحذير رسمي مطابق', askDidTrustNone: 'لا يوجد تحذير',
  askDidAgent: 'سألت وكيل أمان ستيب ({model}، {s} ث). لم يُحفظ النص.',
  askDidChose: 'اخترت الخطوة الأولى: {x}', askDidOverride: 'احتفظت بخطوة خطة الأمان لأن إجابة الوكيل كانت أهدأ من الفحوص',
  askDidQuestion: 'سألتك سؤالاً واحداً', askDidStage: 'بانتظار ضغطتك: تحديث الخطة ({x})',
  askDidReady: 'جهّزت: {x}', askDidNeedsTap: 'بانتظار ضغطتك: {x}', askDidBlocked: 'منعته سياسة الأمان: {x}',
  askToolNext: 'عرض الخطوة التالية في خطتك', askToolRoute: 'فتح {x}', askToolTrusted: 'تنبيه جهة الاتصال الموثوقة',
  askNothingDone: 'لم يتصل أمان ستيب بأي جهة ولم يفعل أي شيء خارج هذا الهاتف.',
  askRemovedKinds: { link: 'رابط', email: 'بريد إلكتروني', iban: 'IBAN', emirates_id: 'هوية إماراتية', card_number: 'رقم بطاقة', phone: 'رقم هاتف', number_or_code: 'رمز أو رقم' },
  askRisk: { insufficient_evidence: 'لا علامات تحذير قوية', caution: 'حذر', high_concern: 'قلق مرتفع' },
});

function t(key) { return copy[language][key] ?? copy.en[key] ?? key; }
function tf(key, values = {}) { return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), t(key)); }
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function agentRuleFloor(caseData) {
  if (['insufficient_evidence', 'caution', 'high_concern'].includes(caseData?.rule_risk)) {
    return caseData.rule_risk;
  }
  if (['active', 'compromised', 'paid'].includes(caseData?.stage)) return 'high_concern';
  if (['suspected', 'reported', 'monitoring'].includes(caseData?.stage)) return 'caution';
  return 'insufficient_evidence';
}

function agentCurrentRisk(caseData) {
  if (['insufficient_evidence', 'caution', 'high_concern'].includes(caseData?.final_risk)) {
    return caseData.final_risk;
  }
  return agentRuleFloor(caseData);
}

function agentContext(caseData = currentCase) {
  return {
    rule_risk: agentRuleFloor(caseData),
    stage: caseData?.stage || 'closed',
    incident_type: caseData?.incident_type || 'unknown',
    reason_codes: caseData?.reason_codes || [],
    tasks: caseData?.tasks || [],
    directory: directoryEntries,
    trusted_contact: trustedOwner
      ? { status: trustedOwner.status, scopes: trustedOwner.scopes || [] }
      : { status: 'inactive', scopes: [] },
  };
}

function refreshAgentDecision(caseData = currentCase) {
  try {
    const observed = window.AmanStepAgent.observe(agentContext(caseData));
    const call = window.AmanStepAgent.selectNext(observed);
    currentAgentDecision = call ? agentRuntime.prepare(call, observed) : null;
  } catch (_error) {
    currentAgentDecision = null;
  }
}

async function executeAgentCall(call, handlers, userConfirmed) {
  const decision = agentRuntime.prepare(call, agentContext());
  if (decision.status === 'blocked') return decision;
  return agentRuntime.execute(decision, {
    userConfirmed,
    handlers,
    reassess: async () => agentContext(),
  });
}

function applyLanguage(nextLanguage) {
  language = copy[nextLanguage] ? nextLanguage : 'en';
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $$('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)); });
  if (currentCase) renderCase(currentCase);
  renderDirectory();
  if (trustedOwner || staticRuntime) renderTrustedOwner();
  renderGuidanceStatus();
  renderConnectionStatus();
  renderQwenStatus();
  renderQwenFacts();
  renderFollowUps(currentCase);
  const analysisResult = $('#analysis-result');
  if (currentRuleAnalysis && analysisResult && !analysisResult.hidden) {
    analysisResult.innerHTML = renderAnalysis(currentRuleAnalysis, currentSafetyMerge);
    renderActionFeed(false);
  }
}

async function api(path, options = {}) {
  const useRelay = relayBase && path.startsWith('/api/trusted/');
  const requestUrl = useRelay ? `${relayBase}${path}` : appPaths.asset(path);
  const response = await fetch(requestUrl, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({ error: 'invalid_response' }));
  if (!response.ok) {
    const error = new Error(data.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

function renderGuidanceStatus() {
  const node = $('#guidance-status');
  if (!node) return;
  node.hidden = !lastVerifiedGuidanceDate && !verifiedGuidanceUnavailable;
  if (lastVerifiedGuidanceDate) {
    node.textContent = t('lastVerifiedGuidance').replace('{date}', lastVerifiedGuidanceDate);
  } else if (verifiedGuidanceUnavailable) {
    node.textContent = t('guidanceUnavailable');
  }
}

function renderConnectionStatus() {
  const node = $('#connection-status');
  if (!node) return;
  const offline = navigator.onLine === false || coreNetworkUnavailable;
  node.hidden = !offline;
  node.textContent = offline ? t('offlineMode') : '';
}

function renderQwenStatus() {
  const node = $('#private-ai-status');
  if (!node) return;
  node.textContent = t(qwenStatus.messageKey || 'privateAIUnavailable');
}

function renderQwenFacts() {
  if (currentRuleAnalysis && currentCase) renderActionFeed(false);
  if (currentCase) void renderIntake(currentCase);
}

async function runQwenExtraction(message) {
  if (qwenRuntime.state().status !== 'ready' || !String(message).trim()) return;
  qwenFacts = null;
  qwenStatus = { kind: 'ready', messageKey: 'privateAIReady' };
  renderQwenFacts();
  renderQwenStatus();
  try {
    qwenFacts = await qwenRuntime.extractIncidentFacts(message, language);
    if (currentRuleAnalysis && currentCase) {
      const modelAssessment = window.AmanStepSafety.assessmentFromFacts({
        pressure_present: qwenFacts.facts.pressure_present,
        asks_for_secret: qwenFacts.facts.asks_for_secret,
        asks_for_app_approval: qwenFacts.facts.asks_for_app_approval,
        asks_for_install: qwenFacts.facts.asks_for_install,
        asks_for_payment: qwenFacts.facts.asks_for_payment,
        detected_language: qwenFacts.facts.detected_language,
      });
      currentSafetyMerge = window.AmanStepSafety.merge({
        risk_level: currentCase.rule_risk,
        stage: currentCase.rule_stage || currentCase.stage,
        reason_codes: currentCase.rule_reason_codes || currentRuleAnalysis.reason_codes,
      }, modelAssessment);
      currentCase = await window.AmanStepCase.applySafetyMerge(currentCase, currentSafetyMerge);
      renderCase(currentCase);
      const analysisResult = $('#analysis-result');
      analysisResult.innerHTML = renderAnalysis(currentRuleAnalysis, currentSafetyMerge);
      analysisResult.hidden = false;
      renderActionFeed(false);
    }
    qwenStatus = { kind: 'ready', messageKey: 'privateAIReady' };
  } catch (_error) {
    qwenFacts = null;
    qwenStatus = { kind: 'ready', messageKey: 'privateAIReady' };
  } finally {
    renderQwenStatus();
    renderQwenFacts();
  }
}

// AI2 gate (owner's phone, 2026-11-18): Qwen3-0.6B ran on WebGPU but took
// 14-36 s per message (decode ~4 tokens/s) and found 0 of 6 scams with the
// app's prompt. Downloading ~335 MB in the background for no benefit is not
// acceptable, so the on-device generative model stays off until a re-test
// passes (PROJECT_PATH 2j). Rules and the official Trust Map do the work.
const PRIVATE_AI_ENABLED = false;

async function prefetchPrivateAI() {
  if (!PRIVATE_AI_ENABLED) {
    qwenStatus = { kind: 'off', messageKey: 'privateAIOff' };
    renderQwenStatus();
    return null;
  }
  if (privateAIPrefetchPromise || qwenRuntime.state().status === 'ready') return privateAIPrefetchPromise;
  if (!window.AmanStepQwen.hasWebGPU()) {
    qwenStatus = { kind: 'unsupported', messageKey: 'privateAINotSupported' };
    renderQwenStatus();
    return null;
  }
  qwenStatus = { kind: 'checking', messageKey: 'privateAIChecking' };
  renderQwenStatus();
  privateAIPrefetchPromise = (async () => {
    try {
      const loaded = await qwenRuntime.loadModel({
        modelKey: 'fallback',
        backgroundPrefetch: true,
        onProgress: () => {
          qwenStatus = { kind: 'loading', messageKey: 'privateAIDownloading' };
          renderQwenStatus();
        },
      });
      qwenStatus = { kind: 'ready', messageKey: 'privateAIReady' };
      renderQwenStatus();
      const message = $('#message')?.value || '';
      if (currentRuleAnalysis && message.trim()) await runQwenExtraction(message);
      return loaded;
    } catch (error) {
      qwenStatus = error.code === 'WIFI_REQUIRED'
        ? { kind: 'waiting_wifi', messageKey: 'privateAIWaitingWifi' }
        : (error.code === 'WEBGPU_UNAVAILABLE'
          ? { kind: 'unsupported', messageKey: 'privateAINotSupported' }
          : { kind: 'unavailable', messageKey: 'privateAIUnavailable' });
      renderQwenStatus();
      return null;
    } finally {
      privateAIPrefetchPromise = null;
    }
  })();
  return privateAIPrefetchPromise;
}

function loadGuidanceBundle() {
  if (!guidanceBundlePromise) {
    const liveBundleUrl = relayBase ? `${relayBase}/data/advisory_bundle.json` : undefined;
    guidanceBundlePromise = window.AmanStepBundle.loadVerifiedBundle(liveBundleUrl)
      .then(({ bundle, source }) => {
        verifiedGuidanceUnavailable = false;
        if (source === 'last_good') {
          lastVerifiedGuidanceDate = bundle.issued_at.slice(0, 10);
          renderGuidanceStatus();
        }
        return bundle;
      })
      .catch((error) => {
        guidanceBundlePromise = null;
        throw error;
      });
  }
  return guidanceBundlePromise;
}

function loadAnalysisResources() {
  if (!analysisResourcesPromise) {
    analysisResourcesPromise = Promise.all([
      window.AmanStepRisk.loadPolicy(),
      loadGuidanceBundle().catch(() => {
        verifiedGuidanceUnavailable = true;
        renderGuidanceStatus();
        return { payload: { brands: [], advisories: [], directory: [] } };
      }),
    ])
      .then(([policy, bundle]) => ({
        policy,
        brands: bundle.payload.brands,
        advisories: bundle.payload.advisories,
        trustMap: bundle.payload.trust_map || null,
      }))
      .catch((error) => {
        analysisResourcesPromise = null;
        throw error;
      });
  }
  return analysisResourcesPromise;
}

async function analyzeLocally(text) {
  const resources = await loadAnalysisResources();
  const analysis = window.AmanStepRisk.analyzeMessage(text, language, resources);
  // Trust Map: compare with the signed official snapshot on this device.
  currentTrust = window.AmanStepTrustMap.check(text, resources.trustMap);
  return window.AmanStepTrustMap.applyToAnalysis(analysis, currentTrust, {
    description: t('trustReason'),
    summary: t('trustSummary'),
  });
}

async function mirrorNewCaseToServer(localCase) {
  if (staticRuntime || navigator.onLine === false) return;
  try {
    const serverCase = await api('/api/incidents', {
      method: 'POST',
      body: JSON.stringify({
        stage: localCase.stage,
        incident_type: localCase.incident_type,
        reason_codes: localCase.reason_codes,
        language: localCase.language,
      }),
    });
    coreNetworkUnavailable = false;
    renderConnectionStatus();
    const updated = await window.AmanStepCase.attachServerMirror(localCase, serverCase);
    if (currentCase?.case_id === updated.case_id) currentCase = updated;
  } catch (_error) {
    coreNetworkUnavailable = true;
    renderConnectionStatus();
    // Core emergency and recovery actions remain fully local.
  }
}

async function startJourney(situation, incidentType, reasonCodes = [], initialIntakeFacts = []) {
  $('#home-status').textContent = t('creating');
  try {
    currentReasonCodes = [...reasonCodes];
    currentCase = await window.AmanStepCase.createCase(
      situation,
      incidentType,
      language,
      currentReasonCodes,
    );
    for (const fact of initialIntakeFacts) {
      currentCase = await window.AmanStepCase.recordIntakeFact(currentCase, fact);
    }
    $('#home-view').hidden = true;
    $('#case-view').hidden = false;
    $('#analysis-section').hidden = situation !== 'checking';
    if (situation === 'checking' && pendingSharedText) $('#message').value = pendingSharedText;
    renderCase(currentCase);
    loadDirectory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    focusCriticalAction();
    void mirrorNewCaseToServer(currentCase);
    return currentCase;
  } catch (error) {
    $('#home-status').textContent = t('failed');
    return null;
  }
}

function openEmergencyHero() {
  window.clearInterval(emergencyCountdownTimer);
  const view = $('#emergency-view');
  const ring = $('#emergency-countdown');
  const count = $('#emergency-count');
  count.textContent = '3';
  view.hidden = false;
  document.body.classList.add('emergency-open');
  $$('.topbar, #home-view, #case-view, #trusted-contact-view, .site-footer').forEach((node) => {
    node.inert = true;
    node.setAttribute('aria-hidden', 'true');
  });
  ring.classList.remove('is-running');
  void ring.offsetWidth;
  ring.classList.add('is-running');
  let remaining = 3;
  emergencyCountdownTimer = window.setInterval(() => {
    remaining -= 1;
    count.textContent = remaining > 0 ? String(remaining) : '✓';
    if (remaining <= 0) window.clearInterval(emergencyCountdownTimer);
  }, 1000);
  emergencyCasePromise = startJourney('active_call', 'unknown').then((result) => {
    if (!view.hidden) $('#emergency-hang').focus({ preventScroll: true });
    return result;
  });
  $('#emergency-hang').focus({ preventScroll: true });
}

async function leaveEmergencyHero() {
  await emergencyCasePromise;
  if (!currentCase) return false;
  window.clearInterval(emergencyCountdownTimer);
  $('#emergency-view').hidden = true;
  document.body.classList.remove('emergency-open');
  $$('.topbar, #home-view, #case-view, #trusted-contact-view, .site-footer').forEach((node) => {
    node.inert = false;
    node.removeAttribute('aria-hidden');
  });
  return true;
}

async function loadDirectory() {
  if (!directoryEntries.length) {
    try {
      const bundle = await loadGuidanceBundle();
      directoryEntries = bundle.payload.directory;
    } catch (error) { directoryEntries = []; }
  }
  renderDirectory();
  if (currentRuleAnalysis && currentCase) renderActionFeed(false);
}

function renderDirectory() {
  const node = $('#directory-list');
  if (!node || !directoryEntries.length) return;
  const cards = directoryEntries.map((entry) => {
    const name = language === 'ar' ? entry.name_ar : entry.name;
    const useWhen = language === 'ar' ? entry.use_when_ar : entry.use_when;
    const instruction = language === 'ar' ? entry.instruction_ar : entry.instruction;
    const officialLink = entry.official_url ? `<button type="button" class="secondary small" data-agent-tool="open_official_route" data-entry-id="${escapeHtml(entry.entry_id)}">${escapeHtml(t('openOfficial'))} ↗</button>` : '';
    const phoneLink = entry.phone ? `<button type="button" class="secondary small" data-agent-tool="start_dialer" data-entry-id="${escapeHtml(entry.entry_id)}" data-phone="${escapeHtml(entry.phone)}">${escapeHtml(t('callOfficial'))} ${escapeHtml(entry.phone)}</button>` : '';
    return `<article class="directory-card"><div class="directory-top"><span>${escapeHtml(entry.kind)}</span><small>${escapeHtml(entry.jurisdiction)}</small></div><h3>${escapeHtml(name)}</h3><p><strong>${escapeHtml(useWhen)}</strong></p><p>${escapeHtml(instruction)}</p><div class="directory-actions">${officialLink}${phoneLink}</div><small>${escapeHtml(t('reviewedOn'))}: ${escapeHtml(entry.last_reviewed_at)}</small></article>`;
  });
  node.innerHTML = `${cards[0]}<details class="more-routes"><summary>${escapeHtml(t('moreRoutes'))} (${cards.length - 1})</summary><div class="directory-list nested">${cards.slice(1).join('')}</div></details><p id="directory-agent-status" class="status" role="status" aria-live="polite"></p>`;
}

function modelPrefillFor(questionId) {
  const facts = qwenFacts?.facts;
  if (!facts) return '';
  if (questionId === 'bank_route') return facts.mentioned_institution_name || '';
  if (questionId === 'amount_range' && facts.mentioned_amount_range !== 'unknown') {
    return facts.mentioned_amount_range;
  }
  if (questionId === 'incident_timing' && facts.mentioned_timing !== 'unknown') {
    return facts.mentioned_timing;
  }
  return '';
}

async function renderIntake(data) {
  const section = $('#intake-section');
  const node = $('#intake-question');
  if (!section || !node) return;
  const question = window.AmanStepIntake.nextQuestion(data);
  const progress = window.AmanStepIntake.progress(data);
  const progressText = t('intakeProgressText')
    .replace('{done}', progress.answered)
    .replace('{total}', progress.total);
  $('#intake-progress').textContent = progressText;
  section.hidden = !['compromised', 'paid', 'reported', 'monitoring'].includes(data.stage);
  if (section.hidden) return;
  const renderVersion = ++intakeRenderVersion;
  if (!question) {
    node.innerHTML = `<p class="intake-complete">✓ ${escapeHtml(t('intakeComplete'))}</p>`;
    $('#intake-status').textContent = '';
    return;
  }
  const result = await executeAgentCall({
    tool: 'ask_clarifying_question',
    risk_level: agentCurrentRisk(data),
    arguments: { question_id: question.question_id },
  }, {
    ask_clarifying_question: () => question,
  }, false);
  if (renderVersion !== intakeRenderVersion || currentCase?.case_id !== data.case_id) return;
  if (result.status !== 'executed') {
    node.innerHTML = '';
    $('#intake-status').textContent = t('agentBlocked');
    return;
  }
  const activeQuestion = result.output;
  if (activeQuestion.kind === 'choice') {
    const suggestion = modelPrefillFor(activeQuestion.question_id);
    const orderedOptions = [...activeQuestion.options].sort((left, right) => (
      Number(right.value === suggestion) - Number(left.value === suggestion)
    ));
    const options = orderedOptions.map((option) => `
      <button type="button" class="intake-option ${option.value === suggestion ? 'is-suggested' : ''}" data-intake-question="${escapeHtml(activeQuestion.question_id)}" data-intake-answer="${escapeHtml(option.value)}">${escapeHtml(t(option.label_key))}${option.value === suggestion ? `<small>${escapeHtml(t('modelSuggested'))}</small>` : ''}</button>`).join('');
    node.innerHTML = `<h3>${escapeHtml(t(activeQuestion.prompt_key))}</h3><div class="intake-options">${options}</div>`;
  } else {
    const suggestion = modelPrefillFor(activeQuestion.question_id);
    node.innerHTML = `<h3>${escapeHtml(t(activeQuestion.prompt_key))}</h3>
      <form id="intake-text-form" data-intake-question="${escapeHtml(activeQuestion.question_id)}">
        <input id="intake-text-answer" maxlength="80" autocomplete="off" value="${escapeHtml(suggestion)}" placeholder="${escapeHtml(t('institutionPlaceholder'))}" required />
        <button type="submit" class="primary small">${escapeHtml(t('saveAnswer'))}</button>
        <button type="button" class="secondary small" data-intake-question="${escapeHtml(activeQuestion.question_id)}" data-intake-answer="not_provided">${escapeHtml(t('skipChoice'))}</button>
      </form>`;
    if (suggestion) node.insertAdjacentHTML('beforeend', `<small class="model-suggestion-note">${escapeHtml(t('modelSuggested'))}</small>`);
  }
  $('#intake-status').textContent = '';
}

async function saveIntakeAnswer(questionId, value) {
  const status = $('#intake-status');
  try {
    const fact = window.AmanStepIntake.validateAnswer(questionId, value);
    currentCase = await window.AmanStepCase.recordIntakeFact(currentCase, fact);
    renderCase(currentCase);
    focusCriticalAction();
  } catch (_error) {
    if (status) status.textContent = t('intakeInvalid');
  }
}

function refreshResumeCard() {
  const node = $('#resume-case');
  if (!node) return;
  node.hidden = !window.AmanStepCase.restoreCase();
}

function openStoredCase() {
  const stored = window.AmanStepCase.restoreCase();
  if (!stored) {
    refreshResumeCard();
    return;
  }
  currentCase = stored;
  language = copy[stored.language] ? stored.language : language;
  $('#language').value = language;
  applyLanguage(language);
  $('#home-view').hidden = true;
  $('#case-view').hidden = false;
  $('#analysis-section').hidden = stored.situation !== 'checking';
  renderCase(stored);
  loadDirectory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  focusCriticalAction();
}

function renderTrustedOwner() {
  const node = $('#trusted-owner-state');
  if (!node) return;
  if (staticRuntime && !relayBase) {
    node.innerHTML = `<p class="status static-relay-notice">${escapeHtml(t('staticRelayUnavailable'))}</p>`;
    return;
  }
  if (!trustedOwner) {
    node.innerHTML = `<p>${escapeHtml(t('coercionStop'))}</p><label class="consent-check"><input id="pairing-consent" type="checkbox" /> <span>${escapeHtml(t('pairingConsent'))}</span></label><button id="create-pairing" type="button" class="secondary" disabled>${escapeHtml(t('createPairing'))}</button><p>${escapeHtml(t('pairingNoRecovery'))}</p><p id="trusted-owner-status" class="status" role="status" aria-live="polite"></p>`;
    return;
  }
  if (trustedOwner.status === 'pending_claim') {
    node.innerHTML = `<div class="pairing-code"><span>${escapeHtml(t('pairingCode'))}</span><strong>${escapeHtml(trustedOwner.invite_code)}</strong></div><p>${escapeHtml(t('contactMustClaim'))}</p><div class="trusted-actions"><a class="secondary small" href="${escapeHtml(`${appPaths.home_url}?view=trusted`)}" target="_blank" rel="noopener">${escapeHtml(t('openContactInbox'))} ↗</a><button id="activate-pairing" type="button" class="primary small">${escapeHtml(t('confirmContact'))}</button><button id="remove-owner-device" type="button" class="secondary small">${escapeHtml(t('removeThisDevice'))}</button></div><p id="trusted-owner-status" class="status" role="status" aria-live="polite"></p>`;
  } else if (trustedOwner.status === 'active') {
    node.innerHTML = `<p class="consent-active">✓ ${escapeHtml(t('pairingActive'))}</p><div class="trusted-actions"><button id="send-trusted-alert" type="button" class="primary">${escapeHtml(t('sendTrustedAlert'))}</button><button id="remove-owner-device" type="button" class="secondary">${escapeHtml(t('removeThisDevice'))}</button></div><p id="trusted-owner-status" class="status" role="status" aria-live="polite"></p>`;
  } else {
    node.innerHTML = `<button id="remove-owner-device" type="button" class="secondary">${escapeHtml(t('removeThisDevice'))}</button><p id="trusted-owner-status" class="status" role="status" aria-live="polite"></p>`;
  }
}

function trustedAlertType(stage) {
  if (['suspected', 'active'].includes(stage)) return 'high_risk';
  if (stage === 'compromised') return 'access_exposed';
  if (stage === 'paid') return 'money_sent';
  if (['reported', 'monitoring'].includes(stage)) return 'recovery_update';
  return '';
}

async function refreshTrustedInbox() {
  if (!trustedContactCredential) return;
  const inbox = await api('/api/trusted/inbox', {
    method: 'POST', body: JSON.stringify({ contact_token: trustedContactCredential.contact_token }),
  });
  if (['awaiting_owner_confirmation', 'active'].includes(inbox.status)) {
    trustedContactCredential = { ...trustedContactCredential, status: inbox.status };
    await trustedCredentialStore.saveContact(trustedContactCredential);
  }
  $('#contact-inbox').hidden = false;
  $('#inbox-alerts').innerHTML = inbox.alerts.length ? inbox.alerts.map((alert) => `<article class="trusted-alert"><div><strong>${escapeHtml(alert.alert_type.replaceAll('_', ' '))}</strong><span>${escapeHtml(alert.created_at)}</span></div><p>${escapeHtml(alert.message)}</p><small>Case ${escapeHtml(alert.case_reference)} · demo inbox only</small></article>`).join('') : `<p class="empty-inbox">${escapeHtml(t('noAlerts'))}</p>`;
}

async function revokeThenRemoveLocal(credential, role) {
  const tokenField = role === 'owner' ? 'owner_token' : 'contact_token';
  try {
    await api(`/api/trusted/pairings/${credential.pairing_id}/revoke`, {
      method: 'POST', body: JSON.stringify({ [tokenField]: credential[tokenField] }),
    });
  } catch (error) {
    if (![403, 404].includes(error.status)) throw error;
  }
  if (role === 'owner') await trustedCredentialStore.deleteOwner();
  else await trustedCredentialStore.deleteContact();
}

async function restoreTrustedCredentials() {
  if (!trustedCredentialStore) return;
  try {
    trustedOwner = await trustedCredentialStore.loadOwner();
    trustedContactCredential = await trustedCredentialStore.loadContact();
    renderTrustedOwner();
    if (currentRuleAnalysis && currentCase) renderActionFeed(false);
    if (trustedContactCredential && (appPaths.isRoute('trusted') || appPaths.hasView('trusted'))) {
      $('#claim-form').hidden = true;
      try {
        await refreshTrustedInbox();
      } catch (error) {
        if (![403, 404].includes(error.status)) throw error;
        await trustedCredentialStore.deleteContact();
        trustedContactCredential = null;
        $('#claim-form').hidden = false;
        $('#claim-status').textContent = t('pairingNoRecovery');
      }
    }
  } catch (_error) {
    const status = $('#trusted-owner-status') || $('#claim-status');
    if (status) status.textContent = t('trustedStorageUnavailable');
  }
}

const FOLLOW_UP_UI = Object.freeze({
  bank_reference: Object.freeze({ label: 'reminderBankReference', delay: 'reminderInOneHour' }),
  ecrime_report: Object.freeze({ label: 'reminderEcrime', delay: 'reminderInSixHours' }),
  statement_check: Object.freeze({ label: 'reminderStatement', delay: 'reminderInOneDay' }),
});

function followUpDate(value) {
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(value));
  } catch (_error) { return String(value); }
}

function renderFollowUps(data = currentCase) {
  const section = $('#followup-section');
  const list = $('#followup-list');
  if (!section || !list) return;
  const eligible = data && ['paid', 'reported', 'monitoring'].includes(data.stage);
  section.hidden = !eligible || !followUpStore;
  if (section.hidden) return;
  const state = followUpStore.state();
  $('#enable-followups').hidden = state.enabled;
  $('#disable-followups').hidden = !state.enabled;
  const reminders = new Map(followUpStore.list().map((item) => [item.kind, item]));
  const tasks = new Set((data.tasks || []).map((task) => task.task_id));
  list.innerHTML = Object.entries(window.AmanStepFollowUps.DEFINITIONS)
    .filter(([, definition]) => tasks.has(definition.task_id))
    .map(([kind, definition]) => {
      const ui = FOLLOW_UP_UI[kind];
      const reminder = reminders.get(kind);
      let stateText = t(ui.delay);
      let action = `<button type="button" class="secondary small" data-followup-schedule="${escapeHtml(kind)}" ${state.enabled ? '' : 'disabled'}>${escapeHtml(t('scheduleFollowup'))} · ${escapeHtml(t(ui.delay))}</button>`;
      if (reminder?.status === 'pending') {
        stateText = `${t('reminderScheduledFor')} ${followUpDate(reminder.due_at)}`;
        action = `<button type="button" class="secondary small" data-followup-cancel="${escapeHtml(kind)}">${escapeHtml(t('cancelFollowup'))}</button>`;
      } else if (reminder?.status === 'delivered') {
        stateText = t('reminderDue');
        action = `<button type="button" class="secondary small" data-followup-cancel="${escapeHtml(kind)}">${escapeHtml(t('dismissFollowup'))}</button>`;
      }
      return `<article class="followup-card ${reminder?.status === 'delivered' ? 'is-due' : ''}">
        <div><strong>${escapeHtml(t(ui.label))}</strong><span>${escapeHtml(stateText)}</span></div>${action}
      </article>`;
    }).join('');
}

async function enableFollowUps() {
  let permission = 'unavailable';
  if ('Notification' in window) {
    permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
  }
  followUpStore.setEnabled(true);
  $('#followup-status').textContent = permission === 'granted'
    ? t('followupsEnabled') : t('followupsInAppOnly');
  renderFollowUps();
  await followUpStore.start();
}

async function scheduleFollowUp(kind) {
  const definition = window.AmanStepFollowUps.DEFINITIONS[kind];
  if (!definition) return;
  const dueAt = new Date(Date.now() + definition.delay_ms).toISOString();
  const result = await executeAgentCall({
    tool: 'schedule_follow_up',
    risk_level: agentCurrentRisk(currentCase),
    arguments: { task_id: definition.task_id, due_at: dueAt },
  }, {
    schedule_follow_up: ({ task, due_at: validatedDueAt }) => followUpStore.schedule({
      kind,
      task_id: task.task_id,
      due_at: validatedDueAt,
      language,
    }),
  }, true);
  $('#followup-status').textContent = result.status === 'executed'
    ? t('followupScheduled') : t('agentBlocked');
  renderFollowUps();
}

function clearActionFeedTimers() {
  actionFeedGeneration += 1;
  actionFeedTimers.forEach((timer) => window.clearTimeout(timer));
  actionFeedTimers = [];
}

function actionFeedItemCopy(item) {
  if (item.id === 'read') return { label: t('feedRead'), why: t('feedReadWhy') };
  if (item.id === 'match' && item.source) {
    return {
      label: `${t('feedMatched')}: ${item.source.agency} · ${item.source.publication_date}`,
      why: `${item.source.agency} · ${item.source.publication_date}`,
    };
  }
  if (item.id === 'match') return { label: t('feedNoMatch'), why: t('feedNoMatchWhy') };
  if (item.id === 'model') {
    const labels = {
      app_approval: 'feedModelApproval',
      remote_access: 'feedModelRemote',
      secret_request: 'feedModelSecret',
      payment_request: 'feedModelPayment',
      pressure: 'feedModelPressure',
    };
    return { label: t(labels[item.scenario] || 'feedModelPressure'), why: t('feedModelWhy') };
  }
  if (item.id === 'plan') {
    return {
      label: t('feedPlanned'),
      why: t('feedPlanWhy'),
    };
  }
  if (item.id === 'next') return { label: item.action.title || t('feedNext'), why: t('feedNextWhy') };
  if (item.id === 'trust') return trustFeedCopy(item);
  if (item.id === 'route') {
    const entry = directoryEntries.find((candidate) => candidate.entry_id === item.entry_id);
    const name = entry ? (language === 'ar' ? entry.name_ar : entry.name) : '';
    const instruction = entry ? (language === 'ar' ? entry.instruction_ar : entry.instruction) : '';
    return { label: `${t('feedRoute')}: ${name}`, why: instruction || t('feedRouteWhy'), note: t('feedRouteWhy') };
  }
  if (item.state === 'ready') return { label: t('feedTrustedReady'), why: t('feedTrustedReadyWhy') };
  return { label: t('feedTrustedSetup'), why: t('feedTrustedSetupWhy') };
}

function trustFeedCopy(item) {
  const fill = (key, values) => Object.entries(values)
    .reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
  const attribution = (sourceId) => {
    const source = item.sources.find((candidate) => candidate.source_id === sourceId);
    return source ? (language === 'ar' ? source.attribution_ar : source.attribution_en) : '';
  };
  const finding = item.finding;
  if (!finding) {
    const count = (id) => item.sources.find((source) => source.source_id === id)?.record_count || 0;
    return {
      label: t('trustNone'),
      why: fill('trustNoneWhy', { cma: count('cma_warnings'), cb: count('cbuae_register') }),
      note: item.sources.map((source) => (language === 'ar' ? source.attribution_ar : source.attribution_en)).join(' '),
    };
  }
  if (finding.type === 'cbuae_licensed') {
    return {
      label: fill('trustLicensed', { x: finding.display_name }),
      why: `${t('trustLicensedWhy')} (${finding.licence_ref})`,
      note: attribution('cbuae_register'),
    };
  }
  const key = { cma_site: 'trustWarnSite', cma_handle: 'trustWarnHandle', cma_name: 'trustWarnName' }[finding.type];
  return {
    label: fill(key, { x: finding.type === 'cma_name' ? finding.display_name : finding.matched }),
    why: fill('trustWarnWhy', { date: finding.published_date || t('trustDateUnknown') }),
    note: attribution('cma_warnings'),
  };
}

function trustFeedLink(item) {
  const sourceId = item.finding?.source_id || 'cma_warnings';
  const source = item.sources.find((candidate) => candidate.source_id === sourceId);
  if (!source) return '';
  return `<a class="feed-source" href="${escapeHtml(source.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('trustOpenSource'))} ↗</a>`;
}

function routeFeedButtons(item) {
  const button = (entryId, label, className) => `<button type="button" class="${className} feed-action" data-agent-tool="open_official_route" data-entry-id="${escapeHtml(entryId)}">${escapeHtml(label)} ↗</button>`;
  const alternates = (item.alternates || []).map((entryId) => {
    const entry = directoryEntries.find((candidate) => candidate.entry_id === entryId);
    if (!entry) return '';
    return button(entryId, `${t('feedRouteAlso')}: ${language === 'ar' ? entry.name_ar : entry.name}`, 'secondary small');
  }).join('');
  return `${button(item.entry_id, t('feedRouteOpen'), 'secondary')}${alternates}`;
}

function renderActionFeed(animate = true) {
  const node = $('#action-feed');
  if (!node) return;
  clearActionFeedTimers();
  currentActionFeed = window.AmanStepActionFeed.build({
    analysis: currentRuleAnalysis,
    caseData: currentCase,
    trustedContact: trustedOwner,
    modelFacts: qwenFacts?.facts || null,
    directory: directoryEntries,
    trust: currentTrust,
    trustedAvailable: !(staticRuntime && !relayBase),
  });
  if (!currentActionFeed) {
    node.hidden = true;
    node.innerHTML = '';
    return;
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const revealImmediately = !animate || reduceMotion;
  const rows = currentActionFeed.items.map((item, index) => {
    const content = actionFeedItemCopy(item);
    const statusIcon = item.state === 'next' ? '→' : (item.state === 'alert' ? '!' : (['setup', 'check'].includes(item.state) ? '○' : '✓'));
    const sourceLink = item.id === 'trust' ? trustFeedLink(item) : item.id === 'match' && item.source
      ? `<a class="feed-source" href="${escapeHtml(item.source.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('feedOpenSource'))} ↗</a>`
      : '';
    const routeButtons = item.id === 'route' ? routeFeedButtons(item) : '';
    const actionButton = routeButtons || (item.id === 'next'
      ? `<button type="button" class="primary feed-action" data-feed-next>${escapeHtml(t('feedContinue'))}: ${escapeHtml(content.label)}</button>`
      : (item.id === 'trusted'
        ? `<button type="button" class="secondary feed-action" data-feed-trusted>${escapeHtml(item.state === 'ready' ? t('feedTellContact') : t('feedSetUpContact'))}</button>`
        : ''));
    return `<li class="feed-item feed-${escapeHtml(item.state)}${revealImmediately ? ' is-visible' : ''}" data-feed-index="${index}" ${revealImmediately ? '' : 'hidden'}>
      <span class="feed-status" aria-hidden="true">${statusIcon}</span>
      <div class="feed-content"><strong>${escapeHtml(content.label)}</strong>${sourceLink}${actionButton}
        <details${['route', 'trust'].includes(item.id) && item.state !== 'done' ? ' open' : (item.id === 'route' ? ' open' : '')}><summary>${escapeHtml(t(item.id === 'route' ? 'feedRouteLook' : 'feedWhy'))}</summary><p>${escapeHtml(content.why)}</p>${content.note ? `<p class="feed-note">${escapeHtml(content.note)}</p>` : ''}</details>
      </div>
    </li>`;
  }).join('');
  node.innerHTML = `<div class="feed-heading"><span class="live-dot" aria-hidden="true"></span><h3 id="action-feed-title" tabindex="-1">${escapeHtml(t('feedTitle'))}</h3></div><ol class="feed-list" aria-live="polite">${rows}</ol>`;
  node.hidden = false;
  if (revealImmediately) return;
  const generation = actionFeedGeneration;
  currentActionFeed.items.forEach((_item, index) => {
    const timer = window.setTimeout(() => {
      if (generation !== actionFeedGeneration) return;
      const row = node.querySelector(`[data-feed-index="${index}"]`);
      if (!row) return;
      row.hidden = false;
      window.requestAnimationFrame(() => row.classList.add('is-visible'));
    }, index * 300);
    actionFeedTimers.push(timer);
  });
  node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#action-feed-title')?.focus({ preventScroll: true });
}

function renderCase(data) {
  currentCase = data;
  refreshAgentDecision(data);
  const stageText = t('stages')[data.stage] || data.stage;
  $('#stage-badge').className = `stage-badge stage-${escapeHtml(data.stage)}`;
  $('#stage-badge').textContent = stageText;
  const stageStep = { suspected: 0, active: 0, compromised: 1, paid: 2, reported: 3, monitoring: 3, closed: 4 }[data.stage] ?? 0;
  $$('#case-progress [data-case-step]').forEach((item) => {
    const itemStep = Number(item.dataset.caseStep);
    item.classList.toggle('is-current', itemStep === stageStep);
    item.classList.toggle('is-complete', itemStep < stageStep);
    if (itemStep === stageStep && stageStep < 4) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  renderNextAction(data.next_safe_action, data.agent_trace);
  renderTasks(data.tasks);
  renderEvents(data.stage);
  void renderIntake(data);
  $('#evidence-section').hidden = !['compromised', 'paid', 'reported', 'monitoring'].includes(data.stage);
  renderFollowUps(data);
  renderAsk();
}


// ---------------------------------------------------------------------------
// Ask AmanStep (G2). Opt-in; nothing leaves the phone before the preview and a
// tap; the server returns codes only; every outside action still goes through
// engine/agent.js; the plan keeps working when the server is down (S6, S13-S16).
// ---------------------------------------------------------------------------
const askAgentBase = relayBase;
let askAgentEnabled = false;
let askState = { phase: 'compose', turns: [], draft: '' };

async function checkAskAgent() {
  askAgentEnabled = false;
  if (!askAgentBase || !window.AmanStepAsk || !window.AmanStepRedact) return;
  try {
    const response = await fetch(`${askAgentBase}/health`, { cache: 'no-store', credentials: 'omit' });
    const health = response.ok ? await response.json() : null;
    askAgentEnabled = health?.agent_turn?.enabled === true && health.agent_turn.stores_text === false;
  } catch (_error) { askAgentEnabled = false; }
  renderAsk();
}

function resetAsk() {
  askState = { phase: 'compose', turns: [], draft: '' };
}

function askRemovedText(removed) {
  const names = t('askRemovedKinds');
  const parts = Object.entries(removed || {}).map(([kind, count]) => `${count} × ${names[kind] || kind}`);
  return parts.length ? tf('askRemoved', { x: parts.join(', ') }) : t('askRemovedNone');
}

function askToolLabel(call) {
  if (call.tool === 'open_official_route') {
    const entry = directoryEntries.find((item) => item.entry_id === call.arguments.entry_id);
    return tf('askToolRoute', { x: entry ? (language === 'ar' ? entry.name_ar : entry.name) : call.arguments.entry_id });
  }
  if (call.tool === 'notify_trusted_contact') return t('askToolTrusted');
  return t('askToolNext');
}

function askStageLabel(event) {
  return t({ paid: 'askStageMoney', compromised: 'askStageAccess', active: 'askStageCall' }[event.stage] || 'askStageAccess');
}

function askProposals() {
  const route = window.AmanStepActionFeed.selectRoute({
    analysis: currentRuleAnalysis || { reason_codes: currentCase?.reason_codes || [] },
    caseData: currentCase,
    directory: directoryEntries,
  });
  const calls = window.AmanStepAsk.proposeCalls({
    caseData: currentCase,
    route,
    trustedActive: trustedOwner?.status === 'active',
    riskLevel: agentCurrentRisk(currentCase),
  });
  return calls.map((call) => ({ call, decision: agentRuntime.prepare(call, agentContext()) }));
}

function renderAskDidList() {
  const items = [];
  const removedCount = Object.values(askState.request?.removed || {}).reduce((sum, value) => sum + value, 0);
  items.push(['done', removedCount ? tf('askDidRedact', { x: removedCount }) : t('askDidRedactNone')]);
  if (currentRuleAnalysis) items.push(['done', tf('askDidRules', { x: t('askRisk')[currentRuleAnalysis.risk_level] || currentRuleAnalysis.risk_level })]);
  if (currentTrust?.available) {
    items.push(['done', tf('askDidTrust', { x: window.AmanStepTrustMap.hasOfficialWarning(currentTrust) ? t('askDidTrustWarn') : t('askDidTrustNone') })]);
  }
  const response = askState.response;
  if (response) items.push(['done', tf('askDidAgent', { model: response.model, s: response.latency_seconds.toFixed(1) })]);
  const decision = askState.decision;
  if (decision?.overridden) items.push(['alert', t('askDidOverride')]);
  else if (decision?.reply) items.push(['done', tf('askDidChose', { x: decision.reply.split('.')[0] })]);
  if (decision?.question) items.push(['next', t('askDidQuestion')]);
  if (decision?.stage_event) items.push(['next', tf('askDidStage', { x: askStageLabel(decision.stage_event) })]);
  for (const { call, decision: gate } of askState.proposals || []) {
    const label = askToolLabel(call);
    if (gate.status === 'blocked') items.push(['blocked', tf('askDidBlocked', { x: label })]);
    else if (gate.requires_user_confirmation) items.push(['next', tf('askDidNeedsTap', { x: label })]);
    else items.push(['done', tf('askDidReady', { x: label })]);
  }
  const icon = { done: '✓', next: '→', alert: '!', blocked: '×' };
  return `<div class="ask-did">
      <h3>${escapeHtml(t('askDidTitle'))}</h3>
      <ol>${items.map(([state, text]) => `<li class="ask-did-${state}"><span aria-hidden="true">${icon[state]}</span>${escapeHtml(text)}</li>`).join('')}</ol>
      <p class="ask-boundary">${escapeHtml(t('askNothingDone'))}</p>
    </div>`;
}

function renderAsk() {
  const section = $('#ask-section');
  const panel = $('#ask-panel');
  if (!section || !panel) return;
  section.hidden = !(askAgentEnabled && currentCase);
  if (section.hidden) return;
  const typed = $('#ask-text');
  if (typed && askState.phase === 'compose') askState.draft = typed.value;
  const state = askState;
  if (state.phase === 'compose') {
    const draft = state.draft || (state.turns.length ? '' : $('#message')?.value || '');
    panel.innerHTML = `
      <label for="ask-text">${escapeHtml(t('askLabel'))}</label>
      <textarea id="ask-text" rows="4" maxlength="4000" placeholder="${escapeHtml(t('askPlaceholder'))}">${escapeHtml(draft)}</textarea>
      <button type="button" class="primary" data-ask="prepare">${escapeHtml(t('askPrepare'))}</button>`;
    return;
  }
  if (state.phase === 'preview') {
    panel.innerHTML = `
      <p class="ask-preview-title">${escapeHtml(t('askPreviewTitle'))}</p>
      ${state.request.preview.map((text) => `<blockquote class="ask-preview" dir="auto">${escapeHtml(text)}</blockquote>`).join('')}
      <p class="ask-removed">${escapeHtml(askRemovedText(state.request.removed))}</p>
      <div class="ask-buttons">
        <button type="button" class="primary" data-ask="send">${escapeHtml(t('askSend'))}</button>
        <button type="button" class="secondary" data-ask="edit">${escapeHtml(t('askEdit'))}</button>
      </div>`;
    return;
  }
  if (state.phase === 'waiting') {
    panel.innerHTML = `<p class="status ask-waiting" role="status">${escapeHtml(t('askThinking'))}</p>`;
    return;
  }
  if (state.phase === 'error') {
    panel.innerHTML = `<p class="status ask-error" role="status">${escapeHtml(t(state.errorKey || 'askUnavailable'))}</p>
      <button type="button" class="secondary" data-ask="again">${escapeHtml(t('askAgain'))}</button>`;
    return;
  }
  const decision = state.decision;
  const answer = decision.overridden
    ? `<p class="ask-override">${escapeHtml(t('askOverride'))}</p>`
    : `<div class="ask-reply"><small>${escapeHtml(t('askAgentSays'))}</small><p>${escapeHtml(decision.reply)}</p></div>`;
  const question = decision.question ? `<div class="ask-question">
      <p><strong>${escapeHtml(t('askQuestion'))}</strong><br />${escapeHtml(decision.question.text)}</p>
      <div class="ask-buttons">${decision.question.choices.map((choice) => `<button type="button" class="secondary small" data-ask="answer" data-question="${escapeHtml(decision.question.id)}" data-choice="${escapeHtml(choice.id)}">${escapeHtml(choice.label)}</button>`).join('')}</div>
    </div>` : '';
  const stage = decision.stage_event ? `<button type="button" class="secondary" data-ask="stage">${escapeHtml(tf('askConfirmStage', { x: askStageLabel(decision.stage_event) }))}</button>` : '';
  const routes = (state.proposals || [])
    .filter(({ call, decision: gate }) => call.tool === 'open_official_route' && gate.status !== 'blocked')
    .map(({ call }) => `<button type="button" class="secondary" data-agent-tool="open_official_route" data-entry-id="${escapeHtml(call.arguments.entry_id)}">${escapeHtml(askToolLabel(call))} ↗</button>`)
    .join('');
  panel.innerHTML = `${answer}${question}<div class="ask-buttons">${stage}${routes}</div>${renderAskDidList()}
    <button type="button" class="secondary small ask-again" data-ask="again">${escapeHtml(t('askAgain'))}</button>`;
}

async function sendAsk() {
  askState.phase = 'waiting';
  renderAsk();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    if (navigator.onLine === false) throw new Error('offline');
    const response = await fetch(`${askAgentBase}/api/agent/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(askState.request.payload),
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 502) { askState.errorKey = 'askRejected'; throw new Error('rejected'); }
    if (!response.ok) throw new Error('unavailable');
    const data = window.AmanStepAsk.validateResponse(await response.json());
    askState.response = data;
    askState.decision = window.AmanStepAsk.decide({
      response: data,
      caseData: currentCase,
      analysis: currentRuleAnalysis,
      turnsUsed: askState.turns.length,
      language,
    });
    askState.proposals = askProposals();
    askState.phase = 'answered';
  } catch (error) {
    if (String(error?.message) === 'agent_response_invalid') askState.errorKey = 'askRejected';
    askState.phase = 'error';
  } finally {
    clearTimeout(timer);
    renderAsk();
  }
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-ask]');
  if (!button) return;
  const step = button.dataset.ask;
  if (step === 'prepare') {
    const text = $('#ask-text')?.value?.trim() || '';
    if (!text) return;
    askState.draft = text;
    askState.turns = [text];
    try {
      askState.request = window.AmanStepAsk.buildRequest({
        language, turns: askState.turns, analysis: currentRuleAnalysis, trust: currentTrust,
      });
      askState.phase = 'preview';
    } catch (_error) { askState.phase = 'compose'; }
    renderAsk();
  } else if (step === 'edit') {
    askState.phase = 'compose';
    renderAsk();
  } else if (step === 'send') {
    await sendAsk();
  } else if (step === 'answer') {
    try {
      askState.turns = [askState.turns[0], window.AmanStepAsk.answerTurn(button.dataset.question, button.dataset.choice, language)];
      askState.request = window.AmanStepAsk.buildRequest({
        language, turns: askState.turns, analysis: currentRuleAnalysis, trust: currentTrust,
      });
      askState.phase = 'preview';
    } catch (_error) { askState.phase = 'error'; }
    renderAsk();
  } else if (step === 'stage') {
    const stageEvent = askState.decision?.stage_event;
    if (!stageEvent || !currentCase) return;
    button.disabled = true;
    // The user's tap is the confirmation; the case engine keeps its own rules.
    currentCase = await window.AmanStepCase.recordEvent(currentCase, stageEvent.event_type, stageEvent.incident_type);
    renderCase(currentCase);
    askState.decision = { ...askState.decision, stage_event: null };
    askState.proposals = askProposals();
    renderAsk();
    $('#next-action h2')?.focus({ preventScroll: false });
  } else if (step === 'again') {
    resetAsk();
    renderAsk();
  }
});

const TRACE_FACT_VALUE_KEYS = Object.freeze({
  bank_transfer: 'bankTransferChoice',
  card_payment: 'cardChoice',
  crypto_transfer: 'cryptoChoice',
  gift_card: 'giftCardChoice',
  last_15_minutes: 'timing15m',
  last_hour: 'timingHour',
  today: 'timingToday',
  earlier: 'timingEarlier',
  not_sure: 'notSureChoice',
  under_aed_500: 'amountUnder500',
  aed_500_to_5000: 'amount500to5000',
  over_aed_5000: 'amountOver5000',
  not_provided: 'skipChoice',
  none_known: 'exposureNone',
  otp_or_code: 'exposureOtp',
  app_approval: 'exposureApproval',
  card_or_password: 'exposureCredentials',
  remote_access: 'exposureRemote',
  unknown_app: 'exposureApp',
});

function renderVisibleDecisionTrace(action) {
  const decision = window.AmanStepTrace.build(currentCase, action);
  if (!decision) return '';
  const ruleSignals = decision.signals.rule_reason_codes.length
    ? decision.signals.rule_reason_codes.map((code) => `<code>${escapeHtml(code)}</code>`).join('')
    : `<span class="trace-empty">${escapeHtml(t('traceNoRuleSignals'))}</span>`;
  const factSignals = decision.signals.structured_facts.map((fact) => {
    const valueKey = TRACE_FACT_VALUE_KEYS[fact.value];
    const value = valueKey ? t(valueKey) : fact.value.replaceAll('_', ' ');
    return `<span class="trace-fact"><small>${escapeHtml(t('traceFactNames')[fact.field] || fact.field)}</small>${escapeHtml(value)}</span>`;
  }).join('');
  const sources = decision.sources.length
    ? decision.sources.map((source) => `
        <a class="trace-source" href="${escapeHtml(source.source_url)}" target="_blank" rel="noopener noreferrer">
          <strong>${escapeHtml(source.agency)}</strong>
          <span>${escapeHtml(t('tracePublished'))}: ${escapeHtml(source.publication_date)}</span>
        </a>`).join('')
    : `<p class="trace-empty">${escapeHtml(t('traceNoSource'))}</p>`;
  const modelRaised = decision.model.raised_risk || decision.model.raised_stage;
  const modelSummary = decision.model.status === 'not_used'
    ? t('traceModelNone')
    : (modelRaised ? t('traceModelRaised') : t('traceModelAdded'));
  const modelCodes = decision.model.reason_codes.length
    ? `<div class="trace-codes">${decision.model.reason_codes.map((code) => `<code>${escapeHtml(code)}</code>`).join('')}</div>`
    : '';
  return `<div class="decision-trace-grid">
      <section class="trace-panel trace-signals">
        <h3>${escapeHtml(t('traceSignals'))}</h3>
        <div class="trace-facts">
          <span class="trace-fact"><small>${escapeHtml(t('traceStage'))}</small>${escapeHtml(t('stages')[decision.signals.stage] || decision.signals.stage)}</span>
          <span class="trace-fact"><small>${escapeHtml(t('traceIncident'))}</small>${escapeHtml(t('incidentTypes')[decision.signals.incident_type] || decision.signals.incident_type)}</span>
          ${factSignals}
        </div>
        <div class="trace-codes">${ruleSignals}</div>
      </section>
      <section class="trace-panel">
        <h3>${escapeHtml(t('tracePolicy'))}</h3>
        <code class="trace-policy-rule">${escapeHtml(decision.policy.rule)}</code>
        <dl><div><dt>${escapeHtml(t('tracePolicyVersion'))}</dt><dd>${escapeHtml(decision.policy.version)}</dd></div><div><dt>${escapeHtml(t('traceSelection'))}</dt><dd>${escapeHtml(decision.policy.selection)}</dd></div></dl>
      </section>
      <section class="trace-panel">
        <h3>${escapeHtml(t('traceSource'))}</h3>
        ${sources}
      </section>
      <section class="trace-panel">
        <h3>${escapeHtml(t('traceModel'))}</h3>
        <p>${escapeHtml(modelSummary)}</p>
        ${modelCodes}
      </section>
    </div>`;
}

function renderNextAction(action, trace) {
  const node = $('#next-action');
  if (!action) {
    node.innerHTML = `<p class="all-done">${escapeHtml(t('completed'))}</p>`;
    return;
  }
  const completionLabel = action.task_id === 'end-pressure-call' ? t('endedCall') : t('done');
  const reason = t('decisionReasons')[trace?.observed_stage] || '';
  const agentDecision = currentAgentDecision?.status === 'ready' ? currentAgentDecision : null;
  const agentTrace = agentDecision ? `
      <div class="agent-policy-trace">
        <strong>${escapeHtml(t('agentPolicyTitle'))}</strong>
        <span><small>${escapeHtml(t('agentObserved'))}</small>${escapeHtml(t('stages')[trace?.observed_stage] || trace?.observed_stage || '')}</span>
        <span><small>${escapeHtml(t('agentSelected'))}</small><code>${escapeHtml(agentDecision.tool)}</code></span>
        <span><small>${escapeHtml(t('agentConfirmation'))}</small>${escapeHtml(agentDecision.requires_user_confirmation ? t('agentConfirmationRequired') : t('agentReady'))}</span>
      </div>` : '';
  const visibleDecisionTrace = renderVisibleDecisionTrace(action);
  const separateTrace = currentRuleAnalysis ? '' : `<details class="decision-trace" open>
      <summary>${escapeHtml(t('whyFirst'))}</summary>
      <p>${escapeHtml(reason)}</p>
      <small>${escapeHtml(t('noExternalAction'))}</small>
      <details class="trace-tech">
        <summary>${escapeHtml(t('techDetails'))}</summary>
        ${visibleDecisionTrace}
        ${agentTrace}
      </details>
    </details>`;
  node.innerHTML = `
    <p class="next-label">${escapeHtml(t('nextNow'))}</p>
    <h2 tabindex="-1">${escapeHtml(action.title)}</h2>
    <p>${escapeHtml(action.description)}</p>
    <button class="action-complete primary" data-task-id="${escapeHtml(action.task_id)}">${escapeHtml(completionLabel)}</button>
    ${separateTrace}`;
}

function focusCriticalAction() {
  const heading = $('#next-action h2');
  if (heading) heading.focus({ preventScroll: true });
}

function renderTasks(tasks) {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  $('#task-progress').textContent = `${completed}/${tasks.length} ${t('stepsDone')}`;
  $('#task-list').innerHTML = tasks.map((task, index) => `
    <article class="task ${task.status === 'completed' ? 'is-complete' : ''}">
      <span class="task-number">${task.status === 'completed' ? '✓' : index + 1}</span>
      <div>
        <div class="task-meta">${escapeHtml(t('priorities')[task.priority] || task.priority)}</div>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description)}</p>
      </div>
      ${task.status === 'pending' ? `<button class="task-complete secondary small" data-task-id="${escapeHtml(task.task_id)}">${escapeHtml(t('markDone'))}</button>` : `<span class="complete-label">${escapeHtml(t('completed'))}</span>`}
    </article>`).join('');
}

function renderEvents(stage) {
  const choices = [];
  if (['suspected', 'active'].includes(stage)) {
    choices.push(['credentials_shared', t('sharedEvent')], ['app_installed', t('installedEvent')], ['money_sent', t('paidEvent')]);
  } else if (['compromised', 'paid'].includes(stage)) {
    if (stage === 'compromised') choices.push(['money_sent', t('paidEvent')]);
    choices.push(['report_submitted', t('reportedEvent')]);
  }
  if (stage !== 'closed') choices.push(['case_closed', t('closeEvent')]);
  $('#change-section').hidden = choices.length === 0;
  $('#event-actions').innerHTML = choices.map(([eventType, label]) => `<button class="event-button" data-event-type="${eventType}">${escapeHtml(label)}</button>`).join('');
}

async function completeTask(taskId) {
  const result = await executeAgentCall({
    tool: 'mark_task_done',
    risk_level: agentCurrentRisk(currentCase),
    arguments: { task_id: taskId },
  }, {
    mark_task_done: async () => {
      currentCase = await window.AmanStepCase.completeTask(currentCase, taskId);
      return { task_id: taskId, status: 'completed' };
    },
  }, true);
  if (result.status !== 'executed') throw new Error(result.reason || 'agent_policy_blocked');
  renderCase(currentCase);
  focusCriticalAction();
  if (currentCase.server_case_id && navigator.onLine !== false) {
    void api(`/api/incidents/${currentCase.server_case_id}/tasks/${taskId}/complete`, {
      method: 'POST', body: '{}',
    }).catch(() => {});
  }
}

async function recordEvent(eventType, incidentType = '') {
  currentCase = await window.AmanStepCase.recordEvent(currentCase, eventType, incidentType);
  renderCase(currentCase);
  focusCriticalAction();
  if (currentCase.server_case_id && navigator.onLine !== false) {
    void api(`/api/incidents/${currentCase.server_case_id}/events`, {
      method: 'POST', body: JSON.stringify({ event_type: eventType, incident_type: incidentType }),
    }).catch(() => {});
  }
}

function renderAnalysis(data, safetyMerge = null) {
  const ruleReasons = data.reasons.map((item) => `
    <div class="reason" data-code="${escapeHtml(item.code)}"><strong>${escapeHtml(item.description)}</strong><span>${escapeHtml(item.evidence)}</span></div>`).join('');
  const modelLabels = t('modelReasonLabels');
  const modelReasons = (safetyMerge?.model_reason_codes || []).map((code) => `
    <div class="reason model-reason" data-code="${escapeHtml(code)}"><strong>${escapeHtml(modelLabels[code] || code)}</strong><span>${escapeHtml(t('modelFactEvidence'))}</span></div>`).join('');
  const reasons = ruleReasons || modelReasons ? `${ruleReasons}${modelReasons}` : `<p>${escapeHtml(t('noRule'))}</p>`;
  const finalRisk = safetyMerge?.final_risk || data.risk_level;
  const raised = Boolean(safetyMerge && (
    safetyMerge.final_risk !== safetyMerge.rule_risk
    || safetyMerge.final_stage !== safetyMerge.rule_stage
  ));
  const mergeNotice = raised ? `<aside class="safety-merge-notice"><strong>${escapeHtml(t('safetyMergeTitle'))}</strong><span>${escapeHtml(t('safetyMergeRaised'))}</span></aside>` : '';
  const sources = data.matched_advisories.length ? data.matched_advisories.map((item) => `
    <div class="source-card"><a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a><span>${escapeHtml(item.agency)} · ${escapeHtml(item.publication_date)} · ${escapeHtml(t('sourceReviewed'))}: ${escapeHtml(item.last_reviewed_at || '—')}</span></div>`).join('') : `<p>${escapeHtml(t('noSource'))}</p>`;
  return `<div class="risk-header"><span class="risk-badge ${escapeHtml(finalRisk)}">${escapeHtml(t('risk')[finalRisk] || finalRisk)}</span><h2>${escapeHtml(data.summary)}</h2></div>${mergeNotice}<h3>${escapeHtml(t('observed'))}</h3>${reasons}<h3>${escapeHtml(t('related'))}</h3>${sources}<h3>${escapeHtml(t('doNext'))}</h3><ol>${data.next_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="disclaimer">${escapeHtml(data.disclaimer)}</p>`;
}

$$('.journey-card').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.situation === 'active_call') {
    openEmergencyHero();
  } else if (button.dataset.situation === 'money_sent') {
    moneyAction = 'new_case';
    $('#money-dialog').showModal();
  } else if (button.dataset.situation === 'shared_data') {
    $('#exposure-dialog').showModal();
  } else {
    startJourney(button.dataset.situation, button.dataset.incidentType);
  }
}));
$('#emergency-hang').addEventListener('click', async () => {
  if (!await leaveEmergencyHero()) return;
  await completeTask('end-pressure-call');
});
$('#emergency-bank').addEventListener('click', async () => {
  if (!await leaveEmergencyHero()) return;
  await loadDirectory();
  $('#directory-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#emergency-trusted').addEventListener('click', async () => {
  if (!await leaveEmergencyHero()) return;
  const sendButton = $('#send-trusted-alert');
  if (trustedOwner?.status === 'active' && sendButton) sendButton.click();
  else {
    $('#trusted-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#create-pairing')?.focus({ preventScroll: true });
  }
});
$('#language').addEventListener('change', async (event) => {
  applyLanguage(event.target.value);
  if (currentCase) {
    try {
      currentCase = await window.AmanStepCase.setLanguage(currentCase, language);
      renderCase(currentCase);
      focusCriticalAction();
      if (currentCase.server_case_id && navigator.onLine !== false) {
        void api(`/api/incidents/${currentCase.server_case_id}/language`, {
          method: 'POST', body: JSON.stringify({ language }),
        }).catch(() => {});
      }
    } catch (error) { /* The current plan stays usable in its previous language. */ }
  }
});
$('#back-home').addEventListener('click', () => {
  clearActionFeedTimers();
  currentActionFeed = null;
  currentCase = null;
  currentRuleAnalysis = null;
  currentSafetyMerge = null;
  qwenFacts = null;
  resetAsk();
  $('#case-view').hidden = true;
  $('#home-view').hidden = false;
  $('#home-status').textContent = '';
  $('#action-feed').hidden = true;
  $('#action-feed').innerHTML = '';
  refreshResumeCard();
});
$('#resume-case-button').addEventListener('click', openStoredCase);

document.addEventListener('click', async (event) => {
  const nextButton = event.target.closest('[data-feed-next]');
  const trustedButton = event.target.closest('[data-feed-trusted]');
  if (!nextButton && !trustedButton) return;
  if (nextButton) {
    const target = $('#next-action');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#next-action .action-complete')?.focus({ preventScroll: true });
    return;
  }
  const sendButton = $('#send-trusted-alert');
  if (currentActionFeed?.items.find((item) => item.id === 'trusted')?.state === 'ready' && sendButton) {
    sendButton.click();
    return;
  }
  $('#trusted-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#create-pairing')?.focus({ preventScroll: true });
});

document.addEventListener('click', async (event) => {
  const answerButton = event.target.closest('[data-intake-answer]');
  if (!answerButton) return;
  answerButton.disabled = true;
  await saveIntakeAnswer(answerButton.dataset.intakeQuestion, answerButton.dataset.intakeAnswer);
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('#intake-text-form');
  if (!form) return;
  event.preventDefault();
  const answer = form.querySelector('#intake-text-answer')?.value || '';
  await saveIntakeAnswer(form.dataset.intakeQuestion, answer);
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-agent-tool]');
  if (!button) return;
  const tool = button.dataset.agentTool;
  const status = $('#directory-agent-status');
  button.disabled = true;
  try {
    const call = tool === 'start_dialer'
      ? {
          tool,
          risk_level: agentCurrentRisk(currentCase),
          arguments: { entry_id: button.dataset.entryId, phone: button.dataset.phone },
        }
      : {
          tool,
          risk_level: agentCurrentRisk(currentCase),
          arguments: { entry_id: button.dataset.entryId },
        };
    const result = await executeAgentCall(call, {
      open_official_route: ({ entry }) => {
        window.open(entry.official_url, '_blank', 'noopener,noreferrer');
        return { entry_id: entry.entry_id, route_opened: true };
      },
      start_dialer: ({ entry }) => {
        window.location.href = `tel:${entry.phone}`;
        return { entry_id: entry.entry_id, dialer_started: true };
      },
    }, true);
    if (status) status.textContent = result.status === 'blocked' ? t('agentBlocked') : '';
  } finally {
    button.disabled = false;
  }
});

document.addEventListener('click', async (event) => {
  const taskButton = event.target.closest('[data-task-id]');
  const eventButton = event.target.closest('[data-event-type]');
  try {
    if (taskButton) { taskButton.disabled = true; await completeTask(taskButton.dataset.taskId); }
    if (eventButton && eventButton.dataset.eventType === 'money_sent') {
      moneyAction = 'case_event';
      $('#money-dialog').showModal();
    } else if (eventButton) { eventButton.disabled = true; await recordEvent(eventButton.dataset.eventType); }
  } catch (error) {
    if (taskButton) taskButton.disabled = false;
    if (eventButton) eventButton.disabled = false;
  }
});

document.addEventListener('click', async (event) => {
  try {
    if (event.target.closest('#create-pairing')) {
      const createButton = event.target.closest('#create-pairing');
      if (!$('#pairing-consent')?.checked) return;
      createButton.disabled = true;
      if (!trustedCredentialStore) throw new Error('trusted_storage_unavailable');
      await trustedCredentialStore.ensureAvailable();
      const existingOwner = await trustedCredentialStore.loadOwner();
      if (existingOwner) {
        trustedOwner = existingOwner;
        renderTrustedOwner();
        return;
      }
      const createdOwner = await api('/api/trusted/pairings', {
        method: 'POST', body: JSON.stringify({ language }),
      });
      try {
        await trustedCredentialStore.createOwner(createdOwner);
      } catch (error) {
        try {
          await api(`/api/trusted/pairings/${createdOwner.pairing_id}/revoke`, {
            method: 'POST', body: JSON.stringify({ owner_token: createdOwner.owner_token }),
          });
        } catch (_revokeError) { /* The local credential is still not retained. */ }
        throw error;
      }
      trustedOwner = createdOwner;
      renderTrustedOwner();
    } else if (event.target.closest('#activate-pairing')) {
      try {
        const activated = await api(`/api/trusted/pairings/${trustedOwner.pairing_id}/activate`, {
          method: 'POST',
          body: JSON.stringify({ owner_token: trustedOwner.owner_token, scopes: ['high_risk', 'post_loss', 'recovery_update'] }),
        });
        trustedOwner = { ...trustedOwner, ...activated };
        await trustedCredentialStore.saveOwner(trustedOwner);
        renderTrustedOwner();
      } catch (error) {
        $('#trusted-owner-status').textContent = String(error.message).startsWith('trusted_storage')
          ? t('trustedStorageUnavailable') : t('pairingWaiting');
      }
    } else if (event.target.closest('#send-trusted-alert')) {
      const alertType = trustedAlertType(currentCase.stage);
      if (!alertType) return;
      if ((!relayBase && !currentCase.server_case_id) || navigator.onLine === false) {
        $('#trusted-owner-status').textContent = t('trustedNeedsConnection');
        return;
      }
      const result = await executeAgentCall({
        tool: 'notify_trusted_contact',
        risk_level: agentCurrentRisk(currentCase),
        arguments: { alert_type: alertType },
      }, {
        notify_trusted_contact: async () => api(`/api/trusted/pairings/${trustedOwner.pairing_id}/alerts`, {
          method: 'POST',
          body: JSON.stringify(relayBase
            ? { owner_token: trustedOwner.owner_token, case_reference: currentCase.case_id.slice(-8), alert_type: alertType, user_confirmed: true }
            : { owner_token: trustedOwner.owner_token, case_id: currentCase.server_case_id, alert_type: alertType, user_confirmed: true }),
        }),
      }, true);
      $('#trusted-owner-status').textContent = result.status === 'executed' ? t('alertQueued') : t('agentBlocked');
    } else if (event.target.closest('#remove-owner-device')) {
      await revokeThenRemoveLocal(trustedOwner, 'owner');
      trustedOwner = null;
      renderTrustedOwner();
      $('#trusted-owner-status').textContent = t('deviceRemoved');
    } else if (event.target.closest('#remove-contact-device')) {
      await revokeThenRemoveLocal(trustedContactCredential, 'contact');
      trustedContactCredential = null;
      $('#contact-inbox').hidden = true;
      $('#claim-form').hidden = false;
      $('#claim-status').textContent = t('deviceRemoved');
    }
  } catch (error) {
    const createButton = event.target.closest('#create-pairing');
    if (createButton && $('#pairing-consent')?.checked) createButton.disabled = false;
    const status = event.target.closest('#remove-contact-device')
      ? $('#claim-status') : $('#trusted-owner-status');
    if (status) status.textContent = String(error.message).startsWith('trusted_storage')
      ? t('trustedStorageUnavailable') : t('failed');
  }
});

document.addEventListener('change', (event) => {
  if (!event.target.closest('#pairing-consent')) return;
  const button = $('#create-pairing');
  if (button) button.disabled = !event.target.checked;
});

$$('[data-payment-type]').forEach((button) => button.addEventListener('click', async () => {
  $('#money-dialog').close();
  const fact = window.AmanStepIntake.validateAnswer('payment_method', button.dataset.paymentType);
  if (moneyAction === 'case_event') {
    await recordEvent('money_sent', button.dataset.paymentType);
    currentCase = await window.AmanStepCase.recordIntakeFact(currentCase, fact);
    renderCase(currentCase);
    focusCriticalAction();
  } else {
    await startJourney('money_sent', button.dataset.paymentType, [], [fact]);
  }
}));

$$('[data-exposure-type]').forEach((button) => button.addEventListener('click', async () => {
  $('#exposure-dialog').close();
  const fact = window.AmanStepIntake.validateAnswer('exposure_type', button.dataset.intakeExposure);
  await startJourney('shared_data', button.dataset.exposureType, [], [fact]);
}));

$('#analysis-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = $('#analysis-status');
  const result = $('#analysis-result');
  status.textContent = t('checking');
  result.hidden = true;
  qwenFacts = null;
  currentRuleAnalysis = null;
  currentSafetyMerge = null;
  currentTrust = null;
  renderQwenFacts();
  try {
    const message = $('#message').value;
    const data = await analyzeLocally(message);
    currentRuleAnalysis = data;
    currentReasonCodes = [...data.reason_codes];
    currentCase = await window.AmanStepCase.recordObservation(
      currentCase, data.reason_codes, data.risk_level, data.matched_advisories,
    );
    renderCase(currentCase);
    result.innerHTML = renderAnalysis(data);
    result.hidden = false;
    renderActionFeed(true);
    status.textContent = '';
    void runQwenExtraction(message);
  } catch (error) { status.textContent = t('analysisFailed'); }
});

$('#evidence-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await executeAgentCall({
    tool: 'draft_report',
    risk_level: agentCurrentRisk(currentCase),
    arguments: { format: 'review_json' },
  }, {
    draft_report: () => window.AmanStepCase.buildEvidencePack(currentCase, {
      amount: $('#evidence-amount').value,
      transaction_reference: $('#evidence-reference').value,
      summary: $('#evidence-summary').value,
    }),
  }, true);
  if (result.status !== 'executed') {
    $('#evidence-status').textContent = t('agentBlocked');
    return;
  }
  const pack = result.output;
  evidencePackText = JSON.stringify(pack, null, 2);
  bankDraftText = pack.report_drafts?.bank_dispute?.text || '';
  ecrimeDraftText = pack.report_drafts?.ecrime_summary?.text || '';
  const blob = new Blob([evidencePackText], { type: 'application/json' });
  if (evidenceObjectUrl) URL.revokeObjectURL(evidenceObjectUrl);
  evidenceObjectUrl = URL.createObjectURL(blob);
  const link = $('#evidence-download-link');
  link.href = evidenceObjectUrl;
  link.download = `amanstep-evidence-${currentCase.case_id.slice(0, 8)}.json`;
  $('#evidence-preview').textContent = evidencePackText;
  $('#bank-draft-preview').textContent = bankDraftText;
  $('#ecrime-draft-preview').textContent = ecrimeDraftText;
  $('#evidence-output').hidden = false;
  $('#evidence-status').textContent = t('draftReady');
});

$('#copy-evidence').addEventListener('click', async () => {
  if (!evidencePackText) return;
  await navigator.clipboard.writeText(evidencePackText);
  $('#evidence-status').textContent = t('copiedDraft');
});

$('#copy-bank-draft').addEventListener('click', async () => {
  if (!bankDraftText) return;
  await navigator.clipboard.writeText(bankDraftText);
  $('#evidence-status').textContent = t('copiedDraft');
});

$('#copy-ecrime-draft').addEventListener('click', async () => {
  if (!ecrimeDraftText) return;
  await navigator.clipboard.writeText(ecrimeDraftText);
  $('#evidence-status').textContent = t('copiedDraft');
});

$('#enable-followups').addEventListener('click', async () => {
  try { await enableFollowUps(); }
  catch (_error) { $('#followup-status').textContent = t('failed'); }
});

$('#disable-followups').addEventListener('click', () => {
  followUpStore?.setEnabled(false);
  $('#followup-status').textContent = t('followupsDisabled');
  renderFollowUps();
});

document.addEventListener('click', async (event) => {
  const scheduleButton = event.target.closest('[data-followup-schedule]');
  const cancelButton = event.target.closest('[data-followup-cancel]');
  try {
    if (scheduleButton) {
      scheduleButton.disabled = true;
      await scheduleFollowUp(scheduleButton.dataset.followupSchedule);
    } else if (cancelButton) {
      followUpStore?.cancel(cancelButton.dataset.followupCancel);
      $('#followup-status').textContent = t('followupCancelled');
      renderFollowUps();
    }
  } catch (_error) {
    $('#followup-status').textContent = t('failed');
    if (scheduleButton) scheduleButton.disabled = false;
  }
});

$('#claim-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    if (!$('#contact-consent')?.checked) return;
    if (!trustedCredentialStore) throw new Error('trusted_storage_unavailable');
    await trustedCredentialStore.ensureAvailable();
    const claim = await api('/api/trusted/claim', {
      method: 'POST',
      body: JSON.stringify({ invite_code: $('#invite-code').value, contact_alias: $('#contact-alias').value }),
    });
    try {
      await trustedCredentialStore.createContact(claim);
    } catch (error) {
      try {
        await api(`/api/trusted/pairings/${claim.pairing_id}/revoke`, {
          method: 'POST', body: JSON.stringify({ contact_token: claim.contact_token }),
        });
      } catch (_revokeError) { /* The local credential is still not retained. */ }
      throw error;
    }
    trustedContactCredential = claim;
    $('#claim-status').textContent = t('inviteAccepted');
    $('#claim-form').hidden = true;
    await refreshTrustedInbox();
  } catch (error) {
    $('#claim-status').textContent = String(error.message).startsWith('trusted_storage')
      ? t('trustedStorageUnavailable') : t('claimFailed');
  }
});

$('#refresh-inbox').addEventListener('click', async () => {
  try { await refreshTrustedInbox(); } catch (error) { $('#claim-status').textContent = t('failed'); }
});

const postedShare = $('#shared-payload');
pendingSharedText = postedShare?.content?.textContent?.trim()
  || '';
postedShare?.remove();
if (pendingSharedText || appPaths.isRoute('share')) {
  window.history.replaceState(null, '', appPaths.home_url);
}
applyLanguage('en');
void prefetchPrivateAI();
const privateAIConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
privateAIConnection?.addEventListener?.('change', () => {
  if (qwenRuntime.state().status !== 'ready') void prefetchPrivateAI();
});
refreshResumeCard();
window.addEventListener('offline', renderConnectionStatus);
window.addEventListener('online', renderConnectionStatus);
if (appPaths.isRoute('trusted') || appPaths.hasView('trusted')) {
  $('#home-view').hidden = true;
  $('#case-view').hidden = true;
  $('#trusted-contact-view').hidden = false;
} else if (pendingSharedText) {
  (async () => {
    let analysis = null;
    try { analysis = await analyzeLocally(pendingSharedText); } catch (error) { /* Plan remains available. */ }
    currentRuleAnalysis = analysis;
    await startJourney('checking', 'unknown', analysis?.reason_codes || []);
    if (analysis && currentCase) {
      currentCase = await window.AmanStepCase.recordObservation(
        currentCase, analysis.reason_codes, analysis.risk_level, analysis.matched_advisories,
      );
      renderCase(currentCase);
      const result = $('#analysis-result');
      result.innerHTML = renderAnalysis(analysis);
      result.hidden = false;
      renderActionFeed(true);
      $('#analysis-status').textContent = '';
    }
  })();
}
void restoreTrustedCredentials();
void checkAskAgent();
if (followUpStore) {
  followUpStore.onDue(() => renderFollowUps());
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(appPaths.asset('sw.js'), { scope: appPaths.base_path })
    .then(() => followUpStore?.start())
    .catch(() => followUpStore?.start());
} else { void followUpStore?.start(); }
